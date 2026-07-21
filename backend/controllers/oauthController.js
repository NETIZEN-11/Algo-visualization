/**
 * OAuth controller — `start` + `callback` for each provider.
 *
 * `start`   — sets a short-lived `oauth_state` cookie, then 302s the
 *             user to the provider's consent screen.
 * `callback` — verifies the state cookie, exchanges the code for an
 *              access token, fetches the user profile, finds-or-creates
 *              a User, and 302s the SPA back to `/oauth/callback` with
 *              our access token in the URL.
 *
 * Account linking rule: if a user with the same email already exists,
 * we attach the new provider to their `oauthProviders` array instead
 * of creating a duplicate. The email must already be verified for
 * linking to be allowed.
 */
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import * as RefreshTokenModel from '../services/tokenService.js'
import {
  generateState,
  isSupportedProvider,
  exchangeCode,
  fetchProfile,
  getProviderConfig,
} from '../services/oauthService.js'
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/jwt.js'
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
} from '../utils/errors.js'
import { msFromDuration } from '../utils/duration.js'

const STATE_TTL_MS = 10 * 60 * 1000 // 10 min
const isProd = process.env.NODE_ENV === 'production'
const REFRESH_TTL_MS = msFromDuration(process.env.JWT_REFRESH_EXPIRE || '30d')

const stateCookieOpts = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax', // cross-site redirect requires lax, not strict
  path: '/',
  maxAge: STATE_TTL_MS,
})

const refreshCookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/',
  maxAge,
})

/* ------------------------------------------------------------------ */
/* start                                                               */
/* ------------------------------------------------------------------ */
export const start = async (req, res, next) => {
  try {
    const provider = req.params.provider
    if (!isSupportedProvider(provider)) {
      throw new BadRequestError(`Unknown provider: ${provider}`)
    }
    // Pre-flight: fail loud if env is not configured. Avoids sending
    // the user to a provider screen that would just error out.
    const cfg = getProviderConfig(provider)
    if (!cfg.clientId() || !cfg.clientSecret()) {
      throw new AppError(
        `${provider} OAuth is not configured on the server`,
        500,
        'OAUTH_NOT_CONFIGURED'
      )
    }

    const state = generateState()
    res.cookie('oauth_state', `${provider}:${state}`, stateCookieOpts())

    // Build the URL inside the controller rather than re-importing the
    // service, so the import surface stays small.
    const { getAuthorizationUrl } = await import('../services/oauthService.js')
    const url = getAuthorizationUrl(provider, { state })
    res.redirect(302, url)
  } catch (err) {
    next(err)
  }
}

/* ------------------------------------------------------------------ */
/* callback                                                            */
/* ------------------------------------------------------------------ */
export const callback = async (req, res, next) => {
  try {
    const provider = req.params.provider
    if (!isSupportedProvider(provider)) {
      throw new BadRequestError(`Unknown provider: ${provider}`)
    }
    const { code, state, error: providerError } = req.query
    if (providerError) {
      return res.redirect(302, failureRedirect(providerError))
    }
    if (!code || !state) {
      throw new BadRequestError('Missing OAuth code or state')
    }

    // Verify the state cookie. We use constant-time compare to avoid
    // timing attacks.
    const cookieValue = req.cookies?.oauth_state
    if (!cookieValue || !cookieValue.includes(':')) {
      throw new UnauthorizedError('OAuth state cookie missing or malformed')
    }
    const [cookieProvider, cookieState] = cookieValue.split(':')
    if (cookieProvider !== provider) {
      throw new UnauthorizedError('OAuth state does not match the requested provider')
    }
    const a = Buffer.from(state)
    const b = Buffer.from(cookieState)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedError('OAuth state mismatch')
    }
    // One-shot — clear the state cookie so it can't be replayed.
    res.clearCookie('oauth_state', { path: '/' })

    // Code → token → profile
    const { accessToken: providerAccessToken } = await exchangeCode(provider, code)
    const profile = await fetchProfile(provider, providerAccessToken)
    if (!profile.providerId) {
      throw new AppError('OAuth profile is missing a stable user id', 502, 'OAUTH_BAD_PROFILE')
    }
    if (!profile.email) {
      // Real providers (Google, GitHub) always hand us an email when
      // we request `email` scope. If we don't get one, refuse to make
      // an account rather than synthesise one.
      throw new AppError(
        'OAuth provider did not return a verified email — cannot create account',
        400,
        'OAUTH_EMAIL_REQUIRED'
      )
    }

    // Find-or-create the local User
    const user = await findOrCreateOAuthUser(profile)

    // Issue our own access + refresh tokens, set the same cookies
    // the normal login path sets. The SPA picks up the access token
    // from the URL (see OAuthCallbackPage) and the refresh token
    // rides along as an httpOnly cookie for /auth/refresh.
    const access = generateAccessToken(user._id)
    const refresh = generateRefreshToken(user._id)
    await RefreshTokenModel.issueRefreshToken({
      userId: user._id,
      jti: refresh.jti,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    res.cookie('access', access, { ...refreshCookieOpts(msFromDuration(process.env.JWT_EXPIRE || '15m')), path: '/api' })
    res.cookie('refresh', refresh.token, refreshCookieOpts(REFRESH_TTL_MS))

    // 302 to the SPA's callback page, which consumes `accessToken`
    // from the URL and then navigates to "/".
    const spa = (process.env.SPA_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
    const target = new URL('/oauth/callback', spa)
    target.searchParams.set('accessToken', access)
    target.searchParams.set('provider', provider)
    res.redirect(302, target.toString())
  } catch (err) {
    next(err)
  }
}

/* ------------------------------------------------------------------ */
/* findOrCreateOAuthUser                                               */
/* ------------------------------------------------------------------ */
async function findOrCreateOAuthUser(profile) {
  // 1. Already linked? Look up by (provider, providerId) — this is the
  //    primary key from the user's perspective.
  const linked = await User.findOne({
    'oauthProviders.provider': profile.provider,
    'oauthProviders.providerId': profile.providerId,
  })
  if (linked) return linked

  const email = profile.email.toLowerCase()

  // 2. Same email already exists? Attach the provider to that account.
  const existing = await User.findOne({ email })
  if (existing) {
    // Don't double-link the same provider.
    const dup = existing.oauthProviders.some(
      (p) => p.provider === profile.provider && p.providerId === profile.providerId
    )
    if (!dup) {
      existing.oauthProviders.push({
        provider: profile.provider,
        providerId: profile.providerId,
        email,
        linkedAt: new Date(),
      })
    }
    // OAuth providers have already verified the email — promote the
    // account to verified.
    existing.emailVerified = true
    existing.lastLoginAt = new Date()
    await existing.save({ validateBeforeSave: false })
    return existing
  }

  // 3. Brand-new user. We need a placeholder password because the
  //    schema enforces minlength: 8. Pick a 64-byte random hex string
  //    so nobody can ever guess it. It's `select: false` so it never
  //    appears in queries or JSON.
  const randomPassword = crypto.randomBytes(64).toString('hex')
  const hashedPassword = await bcrypt.hash(randomPassword, 10)

  return User.create({
    name: profile.name,
    email,
    password: hashedPassword,
    emailVerified: true,
    oauthProviders: [
      {
        provider: profile.provider,
        providerId: profile.providerId,
        email,
        linkedAt: new Date(),
      },
    ],
    avatar: profile.avatar || null,
    lastLoginAt: new Date(),
  })
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function failureRedirect(reason) {
  const spa = (process.env.SPA_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
  const target = new URL('/oauth/callback', spa)
  target.searchParams.set('error', String(reason).slice(0, 200))
  return target.toString()
}
