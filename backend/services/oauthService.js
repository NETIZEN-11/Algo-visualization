import crypto from 'node:crypto'
import axios from 'axios'
import { AppError } from '../utils/errors.js'

const SUPPORTED = ['google', 'github']

const PROVIDERS = {
  google: {
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: () =>
      'https://accounts.google.com/o/oauth2/v2/auth'
        + '?response_type=code'
        + '&scope=openid%20email%20profile'
        + '&prompt=select_account',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  github: {
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    authorizationUrl: () =>
      'https://github.com/login/oauth/authorize'
        + '?response_type=code'
        + '&scope=user%3Aemail',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
  },
}

export const isSupportedProvider = (p) => SUPPORTED.includes(p)

export const getProviderConfig = (provider) => {
  if (!isSupportedProvider(provider)) {
    throw new AppError(`Unsupported OAuth provider: ${provider}`, 400, 'OAUTH_BAD_PROVIDER')
  }
  return PROVIDERS[provider]
}

export const generateState = () => crypto.randomBytes(32).toString('base64url')

export const getAuthorizationUrl = (provider, { state }) => {
  const cfg = getProviderConfig(provider)
  const clientId = cfg.clientId()
  if (!clientId) {
    throw new AppError(
      `${provider} OAuth is not configured (missing client ID)`,
      500,
      'OAUTH_NOT_CONFIGURED'
    )
  }
  const redirectUri = callbackUrl(provider)
  const base = cfg.authorizationUrl()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })
  return `${base}&${params.toString()}`
}

export const exchangeCode = async (provider, code) => {
  const cfg = getProviderConfig(provider)
  const clientId = cfg.clientId()
  const clientSecret = cfg.clientSecret()
  if (!clientId || !clientSecret) {
    throw new AppError(
      `${provider} OAuth is not configured (missing client secret)`,
      500,
      'OAUTH_NOT_CONFIGURED'
    )
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl(provider),
    grant_type: 'authorization_code',
  })

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (provider === 'github') headers.Accept = 'application/json'

  let res
  try {
    res = await axios.post(cfg.tokenUrl, body.toString(), {
      headers,
      timeout: 10_000,
    })
  } catch (err) {
    throw new AppError(
      `OAuth token exchange failed: ${err.response?.data?.error_description || err.message}`,
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED'
    )
  }

  const data = res.data || {}
  const accessToken = data.access_token
  if (!accessToken) {
    throw new AppError(
      `OAuth token response missing access_token: ${JSON.stringify(data)}`,
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED'
    )
  }
  return { accessToken, raw: data }
}

export const fetchProfile = async (provider, accessToken) => {
  const cfg = getProviderConfig(provider)
  const auth = { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10_000 }
  let raw
  try {
    const r = await axios.get(cfg.profileUrl, auth)
    raw = r.data
  } catch (err) {
    throw new AppError(
      `OAuth profile fetch failed: ${err.response?.data?.message || err.message}`,
      502,
      'OAUTH_PROFILE_FETCH_FAILED'
    )
  }

  if (provider === 'github' && !raw.email) {
    try {
      const emailsRes = await axios.get(cfg.emailsUrl, auth)
      const primary = (emailsRes.data || []).find((e) => e.primary && e.verified)
        || (emailsRes.data || []).find((e) => e.verified)
        || (emailsRes.data || [])[0]
      if (primary?.email) raw = { ...raw, email: primary.email }
    } catch {

    }
  }

  return normalizeProfile(provider, raw)
}

export const normalizeProfile = (provider, raw) => {
  if (provider === 'google') {
    return {
      provider: 'google',
      providerId: String(raw.id || raw.sub || ''),
      email: raw.email ? String(raw.email).toLowerCase() : null,
      name: raw.name || raw.given_name || (raw.email ? raw.email.split('@')[0] : 'Google User'),
      avatar: raw.picture || null,
    }
  }
  if (provider === 'github') {
    return {
      provider: 'github',
      providerId: String(raw.id || ''),
      email: raw.email ? String(raw.email).toLowerCase() : null,
      name: raw.name || raw.login || (raw.email ? raw.email.split('@')[0] : 'GitHub User'),
      avatar: raw.avatar_url || null,
    }
  }
  throw new AppError(`Cannot normalize profile for unsupported provider: ${provider}`, 500)
}

function callbackUrl(provider) {
  const base = process.env.OAUTH_REDIRECT_BASE || `http://localhost:${process.env.PORT || 5000}`
  return `${base.replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`
}
