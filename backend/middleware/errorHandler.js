import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'))
}

export const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || 'no-request-id'
  const isProd = process.env.NODE_ENV === 'production'

  const error =
    err instanceof AppError
      ? err
      : new AppError(
          isProd ? 'Internal server error' : err.message,
          err.statusCode || 500,
          err.code || 'INTERNAL_ERROR'
        )

  const logPayload = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    status: error.statusCode,
    code: error.code,
    message: error.message,
    isOperational: error.isOperational,
    userId: req.user?._id?.toString() || null,
  }
  if (!error.isOperational) {
    logPayload.stack = err.stack
    logPayload.originalName = err.name
  }
  if (error.statusCode >= 500) {
    logger.error(logPayload)
  } else {
    logger.warn(logPayload)
  }

  const body = {
    success: false,
    message: error.message,
    code: error.code,
    requestId,
  }
  if (!isProd && error.stack) {
    body.stack = err.stack
  }
  res.status(error.statusCode).json(body)
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
