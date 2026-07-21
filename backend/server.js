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
import { issueCsrfCookie, csrfProtect, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './middleware/csrf.js'
import { httpLogger } from './utils/logger.js'
import { AppError } from './utils/errors.js'
import mongoose from 'mongoose'
import { metricsMiddleware } from './middleware/metrics.js'
import { metricsService } from './services/metricsService.js'
import { installSlowQueryLogger } from './utils/slowQueryLogger.js'

import authRoutes from './routes/authRoutes.js'
import oauthRoutes from './routes/oauthRoutes.js'
import problemRoutes from './routes/problemRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import flashcardRoutes from './routes/flashcardRoutes.js'
import gamificationRoutes from './routes/gamificationRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

import noteRoutes from './routes/noteRoutes.js'
import roadmapRoutes from './routes/roadmapRoutes.js'
import contestRoutes from './routes/contestRoutes.js'
import submissionRoutes from './routes/submissionRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import playgroundRoutes from './routes/playgroundRoutes.js'
import bookmarkRoutes from './routes/bookmarkRoutes.js'
import visualizeRoutes from './routes/visualizeRoutes.js'
import companyRoutes from './routes/companyRoutes.js'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  const required = ['JWT_SECRET', 'MONGODB_URI']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {

    console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {

    console.error('❌ Refusing to boot: JWT_SECRET is still the placeholder value')
    process.exit(1)
  }
  if (process.env.MOCK_AI === 'true') {

    console.error('❌ Refusing to boot: MOCK_AI=true is not allowed in production')
    process.exit(1)
  }
}

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const corsOptions = {
  origin(origin, cb) {

    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true)
    }

    return cb(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', CSRF_HEADER_NAME],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
}

const app = express()

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(securityHeaders())
app.use(permissionsPolicy)

app.use(requestId)

app.use(cookieParser(process.env.COOKIE_SECRET))

app.use(cors(corsOptions))

app.use(issueCsrfCookie)
app.use(csrfProtect)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

app.use(httpLogger)

app.use(metricsMiddleware)

app.use(globalRateLimiter)

connectDB().then(() => {

  installSlowQueryLogger()
}).catch((err) => {

  console.error('Database connection failed:', err)
  process.exit(1)
})

app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))

app.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const mongoState = mongoose.connection.readyState
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

app.use('/api/auth', authRoutes)
app.use('/api/auth/oauth', oauthRoutes)
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
app.use('/api/visualize', visualizeRoutes)
app.use('/api/companies', companyRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

if (process.env.RUN_SERVER !== 'false') {
  const server = app.listen(PORT, () => {

    console.log(`🚀 AlgoVision AI API listening on :${PORT} (${process.env.NODE_ENV || 'development'})`)
  })

  const shutdown = (signal) => {

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
