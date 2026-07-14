/**
 * JWT helpers — short-lived access tokens + long-lived refresh tokens.
 *
 * Both tokens are HS256-signed with `JWT_SECRET`. A separate
 * `JWT_REFRESH_SECRET` (defaulting to `JWT_SECRET` if unset) is used for
 * refresh tokens so a leaked access secret cannot mint refresh tokens.
 *
 * Each refresh token carries a `jti` (JWT ID) so we can revoke individual
 * sessions via the `TokenService`.
 */
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const ACCESS_TTL = process.env.JWT_EXPIRE || '15m'
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRE || '30d'

const getAccessSecret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not configured')
  return s
}

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || getAccessSecret()

/** Generate a short-lived access token. */
export const generateAccessToken = (userId, extra = {}) => {
  return jwt.sign({ id: userId, typ: 'access', ...extra }, getAccessSecret(), {
    expiresIn: ACCESS_TTL,
    issuer: 'algovision-ai',
  })
}

/**
 * Generate a long-lived refresh token with a unique `jti`. The id is
 * needed by the token service to revoke a single session.
 */
export const generateRefreshToken = (userId, jti = null) => {
  const tokenJti = jti || crypto.randomUUID()
  const token = jwt.sign({ id: userId, typ: 'refresh', jti: tokenJti }, getRefreshSecret(), {
    expiresIn: REFRESH_TTL,
    issuer: 'algovision-ai',
  })
  return { token, jti: tokenJti }
}

export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, getAccessSecret(), { issuer: 'algovision-ai' })
  if (decoded.typ !== 'access') throw new Error('Wrong token type')
  return decoded
}

export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, getRefreshSecret(), { issuer: 'algovision-ai' })
  if (decoded.typ !== 'refresh') throw new Error('Wrong token type')
  return decoded
}

// Back-compat — the rest of the codebase calls `generateToken` and
// `verifyToken`. Map them to the access-token implementation so existing
// call sites keep working while we migrate to cookies + refresh rotation.
export const generateToken = (userId) => generateAccessToken(userId)
export const verifyToken = (token) => verifyAccessToken(token)
