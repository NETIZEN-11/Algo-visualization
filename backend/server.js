/**
 * AlgoVision AI — Express server entry point.
 *
 * Boots in this order:
 *   1. Load env, fail fast on weak secrets in production.
 *   2. Connect to MongoDB.
 *   3. Wire security middleware (helmet, CORS, body parser, cookies, CSRF).
 *   4. Wire request-level middleware (request id, http log, rate limit).
 *   5. Mount routes and health endpoints.
 *   6. Wire error handler and 404 fallthrough.
 *   7. Listen (only when this file is the entry point, not under test).
 *   8. Install graceful shutdown handlers.
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'

import connectDB from './config/database.js'
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler.js'
import { globalRateLimiter } from './middleware/rateLimiter.js'
import { requestId } from './middleware/requestId.js'
import { securityHeaders, permissionsPolicy } from './middleware/securityHeaders.js'
import { issueCsrfCookie, csrfProtect, sendCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './middleware/csrf.js'
import { httpLogger } from './utils/logger.js'
import { AppError } from './utils/errors.js'
import mongoose from 'mongoose'
import { metricsMiddleware } from './middleware/metrics.js'
import { metricsService } from './services/metricsService.js'
import { installSlowQueryLogger } from './utils/slowQueryLogger.js'

// Routes
import authRoutes from './routes/authRoutes.js'
import problemRoutes from './routes/problemRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import flashcardRoutes from './routes/flashcardRoutes.js'
import gamificationRoutes from './routes/gamificationRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
// Phase 5 routes
import noteRoutes from './routes/noteRoutes.js'
import roadmapRoutes from './routes/roadmapRoutes.js'
import contestRoutes from './routes/contestRoutes.js'
import submissionRoutes from './routes/submissionRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import playgroundRoutes from './routes/playgroundRoutes.js'
import bookmarkRoutes from './routes/bookmarkRoutes.js'

const isProd = process.env.NODE_ENV === 'production'

/* ------------------------------------------------------------------ */
/* Fail-fast checks — refuse to boot in production with bad config.   */
/* ------------------------------------------------------------------ */
if (isProd) {
  const required = ['JWT_SECRET', 'MONGODB_URI']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
    // eslint-disable-next-line no-console
    console.error('❌ Refusing to boot: JWT_SECRET is still the placeholder value')
    process.exit(1)
  }
  if (process.env.MOCK_AI === 'true') {
    // eslint-disable-next-line no-console
    console.error('❌ Refusing to boot: MOCK_AI=true is not allowed in production')
    process.exit(1)
  }
}

/* ------------------------------------------------------------------ */
/* CORS allow-list                                                     */
/* ------------------------------------------------------------------ */
const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const corsOptions = {
  origin(origin, cb) {
    // Same-origin / curl requests have no Origin header — allow.
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true)
    }
    // Unknown origin: respond without CORS headers (browser will block).
    // We do NOT throw — that would surface as 500 and make the API look broken.
    return cb(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', CSRF_HEADER_NAME],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
const app = express()

app.set('trust proxy', 1) // honour X-Forwarded-For for rate-limiting behind a LB
app.disable('x-powered-by')

// Security headers
app.use(securityHeaders())
app.use(permissionsPolicy)

// Request id first — every other middleware can read it.
app.use(requestId)

// Cookies before CSRF so the middleware can read XSRF-TOKEN.
app.use(cookieParser(process.env.COOKIE_SECRET))

// CORS
app.use(cors(corsOptions))

// CSRF: issue a token cookie on every safe request, verify on unsafe ones.
app.use(issueCsrfCookie)
app.use(csrfProtect)

// Body parsing + compression
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

// HTTP access log
app.use(httpLogger)

// Request metrics (latency, status counts)
app.use(metricsMiddleware)

// Rate limit (global)
app.use(globalRateLimiter)

/* ------------------------------------------------------------------ */
/* Database                                                            */
/* ------------------------------------------------------------------ */
connectDB().then(() => {
  // Slow-query logger only after Mongoose is connected so we patch live models
  installSlowQueryLogger()
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Database connection failed:', err)
  process.exit(1)
})

/* ------------------------------------------------------------------ */
/* Health & meta                                                       */
/* ------------------------------------------------------------------ */
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))

app.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const mongoState = mongoose.connection.readyState // 1 == connected
    if (mongoState !== 1) {
      throw new AppError('MongoDB not ready', 503, 'MONGO_NOT_READY')
    }
    const { cacheService } = await import('./services/cacheService.js')
    res.json({ status: 'ok', mongo: 'ready', cacheL2: cacheService.isL2Ready() ? 'ready' : 'memory-only' })
  })
)

app.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(metricsService.render())
  })
)

app.get(
  '/api/csrf',
  asyncHandler(async (req, res) => {
    res.json({ csrfToken: req.cookies?.[CSRF_COOKIE_NAME] || req.csrfToken || null })
  })
)

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/flashcards', flashcardRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/roadmap', roadmapRoutes)
app.use('/api/contest', contestRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/playground', playgroundRoutes)
app.use('/api/bookmarks', bookmarkRoutes)

/* ------------------------------------------------------------------ */
/* 404 + error handler                                                 */
/* ------------------------------------------------------------------ */
app.use(notFound)
app.use(errorHandler)

/* ------------------------------------------------------------------ */
/* Listen                                                               */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000

if (process.env.RUN_SERVER !== 'false') {
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 AlgoVision AI API listening on :${PORT} (${process.env.NODE_ENV || 'development'})`)
  })

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — closing HTTP server`)
    server.close(() => {
      mongoose.connection.close().catch(() => {})
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
