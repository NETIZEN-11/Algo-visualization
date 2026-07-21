/**
 * Auth middleware.
 *
 * `protect` accepts the access token from EITHER:
 *   - `Authorization: Bearer <token>` (used by services / Postman)
 *   - the `access` httpOnly cookie (used by the SPA after login)
 *
 * On a valid token, the user document is loaded and attached to `req.user`.
 * If a refresh cookie is present and the access token is missing or
 * expired, the SPA can call `/api/auth/refresh` to mint a new pair.
 */
import { verifyAccessToken } from '../utils/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'
import User from '../models/User.js'
import { asyncHandler } from './errorHandler.js'

const readTokenFromRequest = (req) => {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim()
  if (req.cookies?.access) return req.cookies.access
  return null
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = readTokenFromRequest(req)
  if (!token) {
    return next(new UnauthorizedError('Not authorized to access this route'))
  }

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch {
    return next(new UnauthorizedError('Token is invalid or expired'))
  }

  const user = await User.findById(decoded.id).select('-password')
  if (!user) return next(new UnauthorizedError('User not found'))
  if (user.isDisabled) return next(new ForbiddenError('Account is disabled'))

  req.user = user
  next()
})

export const authorize = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User role '${req.user.role}' is not authorized to access this route`
        )
      )
    }
    next()
  })

/**
 * `optionalAuth` — like `protect`, but does NOT 401 when no token is
 * present. Used by endpoints that work for both guests and signed-in
 * users (e.g. the dynamic visualisation engine, which is free for
 * everyone but personalises results for signed-in users). A bad or
 * expired token is treated the same as no token.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readTokenFromRequest(req)
  if (!token) return next()
  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch {
    return next()
  }
  const user = await User.findById(decoded.id).select('-password')
  if (user && !user.isDisabled) req.user = user
  next()
})
