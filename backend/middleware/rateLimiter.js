import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import IORedis from 'ioredis'

let redis = null
if (process.env.REDIS_URL) {
  try {
    redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
    })
    redis.on('error', () => {

      if (!redis._errored) {
        redis._errored = true

        console.warn('⚠️  Redis rate-limit store unavailable, falling back to in-memory')
      }
    })
  } catch {
    redis = null
  }
}

const store = (prefix) =>
  redis
    ? new RedisStore({ sendCommand: (...args) => redis.call(...args), prefix })
    : undefined

const msg = (text) => ({
  success: false,
  code: 'RATE_LIMITED',
  message: text,
})

export const globalRateLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:global:'),
      message: msg('Too many requests from this IP, please try again later.'),
    })

export const strictRateLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:strict:'),
      message: msg('Too many requests, please slow down.'),
    })

export const authRateLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:auth:'),
      skipSuccessfulRequests: true,
      message: msg('Too many authentication attempts. Please try again in 15 minutes.'),
    })

export const passwordResetLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:pwreset:'),
      message: msg('Too many password-reset attempts. Please try again in an hour.'),
    })

export const aiRateLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:ai:'),
      keyGenerator: (req) => req.user?._id?.toString() || req.ip,
      message: msg('AI rate limit reached. Please wait a minute and try again.'),
    })

export default process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : globalRateLimiter
