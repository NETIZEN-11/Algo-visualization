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

  if (!req.cookies || !req.cookies[COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('base64url')
    res.cookie(COOKIE_NAME, token, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    })
    req.csrfToken = token
  } else {
    req.csrfToken = req.cookies[COOKIE_NAME]
  }
  next()
}

export const csrfProtect = (req, res, next) => {

  if (process.env.DISABLE_CSRF === 'true') return next()

  if (!UNSAFE.has(req.method)) return next()

  const cookieToken = req.cookies?.[COOKIE_NAME]
  const headerToken = req.headers[HEADER_NAME.toLowerCase()]

  if (!cookieToken && !headerToken && process.env.DISABLE_CSRF === 'true') return next()

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token missing',
    })
  }

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

export const sendCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken || req.cookies?.[COOKIE_NAME] || null })
}

export const CSRF_COOKIE_NAME = COOKIE_NAME
export const CSRF_HEADER_NAME = HEADER_NAME
export { SAFE_ORIGINS }
