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
  getAuthorizationUrl,
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

const STATE_TTL_MS = 10 * 60 * 1000
const isProd = process.env.NODE_ENV === 'production'
const REFRESH_TTL_MS = msFromDuration(process.env.JWT_REFRESH_EXPIRE || '30d')

const stateCookieOpts = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
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

export const start = async (req, res, next) => {
  try {
    const provider = req.params.provider
    if (!isSupportedProvider(provider)) {
      throw new BadRequestError(`Unknown provider: ${provider}`)
    }
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

    const url = getAuthorizationUrl(provider, { state })
    res.redirect(302, url)
  } catch (err) {
    next(err)
  }
}

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
    res.clearCookie('oauth_state', { path: '/' })

    const { accessToken: providerAccessToken } = await exchangeCode(provider, code)
    const profile = await fetchProfile(provider, providerAccessToken)
    if (!profile.providerId) {
      throw new AppError('OAuth profile is missing a stable user id', 502, 'OAUTH_BAD_PROFILE')
    }
    if (!profile.email) {
      throw new AppError(
        'OAuth provider did not return a verified email — cannot create account',
        400,
        'OAUTH_EMAIL_REQUIRED'
      )
    }

    const user = await findOrCreateOAuthUser(profile)

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

    const spa = (process.env.SPA_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
    const target = new URL('/oauth/callback', spa)
    target.searchParams.set('accessToken', access)
    target.searchParams.set('provider', provider)
    res.redirect(302, target.toString())
  } catch (err) {
    next(err)
  }
}

async function findOrCreateOAuthUser(profile) {
  const linked = await User.findOne({
    'oauthProviders.provider': profile.provider,
    'oauthProviders.providerId': profile.providerId,
  })
  if (linked) return linked

  const email = profile.email.toLowerCase()

  const existing = await User.findOne({ email })
  if (existing) {
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
    existing.emailVerified = true
    existing.lastLoginAt = new Date()
    await existing.save({ validateBeforeSave: false })
    return existing
  }

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

function failureRedirect(reason) {
  const spa = (process.env.SPA_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
  const target = new URL('/oauth/callback', spa)
  target.searchParams.set('error', String(reason).slice(0, 200))
  return target.toString()
}
