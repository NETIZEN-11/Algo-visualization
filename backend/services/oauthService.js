/**
 * OAuth 2.0 service — Google + GitHub.
 *
 * Implements the standard authorization-code flow:
 *
 *   1. Server generates a `state` token, stores it in an httpOnly cookie,
 *      and 302s the user to the provider's authorization URL.
 *   2. The provider prompts the user to sign in / consent, then 302s
 *      back to our callback with `code` and `state`.
 *   3. The callback validates `state`, exchanges `code` for an access
 *      token, fetches the user's profile, and creates or links a User.
 *
 * Why we don't use `passport-google-oauth20` / `passport-github2`:
 * those packages add a heavy abstraction over what's really just three
 * HTTP calls. Keeping it inline means fewer transitive deps, less
 * configuration surface, and we can unit-test the URL-builder and
 * profile-normaliser without spinning up a mock server.
 */
import crypto from 'node:crypto'
import axios from 'axios'
import { AppError } from '../utils/errors.js'

/* ------------------------------------------------------------------ */
/* Provider configuration                                              */
/* ------------------------------------------------------------------ */
const SUPPORTED = ['google', 'github']

const PROVIDERS = {
  google: {
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    // `openid email profile` gets us id, email, and basic profile
    // without forcing a refresh-token grant. `select_account` makes
    // Google always show the account picker (better UX on shared machines).
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
    // `user:email` is a separate scope from `read:user` — the former
    // returns the primary email even when it's set to private.
    authorizationUrl: () =>
      'https://github.com/login/oauth/authorize'
        + '?response_type=code'
        + '&scope=user%3Aemail',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    // GitHub may not include the email on `/user` when the user has
    // private-email mode on; we fetch it from this endpoint as a
    // fallback.
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

/* ------------------------------------------------------------------ */
/* State token — random 32-byte base64url, used as CSRF defence.       */
/* ------------------------------------------------------------------ */
export const generateState = () => crypto.randomBytes(32).toString('base64url')

/* ------------------------------------------------------------------ */
/* Authorization URL builder                                            */
/* ------------------------------------------------------------------ */
/**
 * Build the provider's authorization URL. We pass `state` through so
 * the caller can persist it in a cookie before redirecting.
 */
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

/* ------------------------------------------------------------------ */
/* Code exchange — POST to provider's token endpoint                   */
/* ------------------------------------------------------------------ */
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
  // GitHub recommends an explicit Accept header; the others don't care.
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

/* ------------------------------------------------------------------ */
/* Profile fetch — GET to provider's userinfo / /user endpoint         */
/* ------------------------------------------------------------------ */
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

  // GitHub quirk: the primary email may be null and the user may have
  // marked it private. Fall back to /user/emails which always returns
  // the list (when scope `user:email` is granted).
  if (provider === 'github' && !raw.email) {
    try {
      const emailsRes = await axios.get(cfg.emailsUrl, auth)
      const primary = (emailsRes.data || []).find((e) => e.primary && e.verified)
        || (emailsRes.data || []).find((e) => e.verified)
        || (emailsRes.data || [])[0]
      if (primary?.email) raw = { ...raw, email: primary.email }
    } catch {
      /* leave email null; we still create the user with providerId */
    }
  }

  return normalizeProfile(provider, raw)
}

/* ------------------------------------------------------------------ */
/* Profile normalisation — map provider-specific shapes to one shape   */
/* ------------------------------------------------------------------ */
/**
 * Returns a uniform object:
 *   { provider, providerId, email, name, avatar }
 *
 * Both providers issue a stable numeric/string ID; we use that as
 * `providerId` so we can detect "this Google account already exists"
 * even if the user changes their email.
 */
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

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */
function callbackUrl(provider) {
  const base = process.env.OAUTH_REDIRECT_BASE || `http://localhost:${process.env.PORT || 5000}`
  return `${base.replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`
}
