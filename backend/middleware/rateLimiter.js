/**
 * Rate-limit policies.
 *
 * Three policies, three concerns:
 *   - globalRateLimiter:    apply to all routes; 100 req / 15 min / IP
 *   - strictRateLimiter:    apply to write-heavy / scrape endpoints
 *   - authRateLimiter:      register / login / refresh (5/15 min / IP)
 *   - passwordResetLimiter: forgot / reset password (3/hour / IP)
 *   - aiRateLimiter:        per-user AI calls (30/min)
 *
 * In production we use Redis as the shared store so limits are honoured
 * across replicas; the package falls back to in-memory if Redis is
 * unreachable, so the dev experience is unchanged.
 */
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
      // If Redis dies, rate-limit-redis falls back to in-memory. Log once.
      if (!redis._errored) {
        redis._errored = true
        // eslint-disable-next-line no-console
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
      max: 5, // 5 failed attempts / 15 min
      standardHeaders: true,
      legacyHeaders: false,
      store: store('rl:auth:'),
      skipSuccessfulRequests: true, // only count failures
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

/** Per-user AI limiter — keyed off `req.user.id` once auth middleware has run. */
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

// Back-compat default export for existing call sites.
export default process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, _res, next) => next()
  : globalRateLimiter
