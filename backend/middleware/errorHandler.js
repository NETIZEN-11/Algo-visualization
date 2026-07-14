/**
 * Structured error handler.
 *
 * - Maps known `AppError` subclasses to their declared statusCode.
 * - Treats anything else as a 500.
 * - Sanitises the response in production (no stack, generic message).
 * - Logs every error with the request id so it can be correlated with
 *   downstream logs (Loki, Datadog, ELK, etc.).
 */
import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'))
}

export const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || 'no-request-id'
  const isProd = process.env.NODE_ENV === 'production'

  // Normalize to AppError
  const error =
    err instanceof AppError
      ? err
      : new AppError(
          isProd ? 'Internal server error' : err.message,
          err.statusCode || 500,
          err.code || 'INTERNAL_ERROR'
        )

  // Log with structured fields; never log secrets or passwords.
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

/**
 * Wraps an async route handler so thrown promises hit the error handler
 * instead of crashing the process. Use as:
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
