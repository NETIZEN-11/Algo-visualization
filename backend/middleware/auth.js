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
