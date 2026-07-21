/**
 * CSRF protection — double-submit-cookie pattern.
 *
 * 1. On any safe request, a `csrfToken` is generated and set as an
 *    `XSRF-TOKEN` cookie. The cookie is NOT httpOnly so the SPA can read
 *    it, but it IS `SameSite=Strict` and (in production) `Secure`.
 * 2. The SPA echoes the value in an `X-XSRF-TOKEN` request header.
 * 3. For unsafe methods (POST/PUT/PATCH/DELETE), this middleware compares
 *    the cookie and the header; if they don't match, the request is
 *    rejected with 403.
 *
 * This works for SPAs because cookies are sent automatically on every
 * request, and the JS reads `XSRF-TOKEN` to put into a header. The
 * attacker cannot read the cookie value to forge the header.
 */
import crypto from 'node:crypto'

const COOKIE_NAME = 'XSRF-TOKEN'
const HEADER_NAME = 'X-XSRF-TOKEN'
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const SAFE_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const isProd = process.env.NODE_ENV === 'production'

export const issueCsrfCookie = (req, res, next) => {
  // Only set if absent — never rotate on every request, that defeats the
  // purpose of the double-submit pattern.
  if (!req.cookies || !req.cookies[COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('base64url')
    res.cookie(COOKIE_NAME, token, {
      httpOnly: false, // SPA must read this
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    })
    req.csrfToken = token
  } else {
    req.csrfToken = req.cookies[COOKIE_NAME]
  }
  next()
}

export const csrfProtect = (req, res, next) => {
  // Test bypass — integration tests run with no cookie roundtrip.
  if (process.env.DISABLE_CSRF === 'true') return next()

  if (!UNSAFE.has(req.method)) return next()

  const cookieToken = req.cookies?.[COOKIE_NAME]
  const headerToken = req.headers[HEADER_NAME.toLowerCase()]

  // If we're in a non-browser context (e.g. an integration test) and CSRF
  // is explicitly disabled, allow it through. Note: this no longer falls
  // through on `req.user` — an authenticated SPA still needs a token, so
  // a stolen access token via XSS can't bypass the protection.
  if (!cookieToken && !headerToken && process.env.DISABLE_CSRF === 'true') return next()

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token missing',
    })
  }
  // Constant-time compare
  const a = Buffer.from(cookieToken)
  const b = Buffer.from(headerToken)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({
      success: false,
      code: 'CSRF_TOKEN_INVALID',
      message: 'CSRF token invalid',
    })
  }
  return next()
}

/** Helper for sending the current CSRF token to the SPA on first load. */
export const sendCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken || req.cookies?.[COOKIE_NAME] || null })
}

export const CSRF_COOKIE_NAME = COOKIE_NAME
export const CSRF_HEADER_NAME = HEADER_NAME
export { SAFE_ORIGINS }
