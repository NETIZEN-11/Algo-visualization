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

export const generateAccessToken = (userId, extra = {}) => {
  return jwt.sign({ id: userId, typ: 'access', ...extra }, getAccessSecret(), {
    expiresIn: ACCESS_TTL,
    issuer: 'algovision-ai',
  })
}

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

export const generateToken = (userId) => generateAccessToken(userId)
export const verifyToken = (token) => verifyAccessToken(token)
