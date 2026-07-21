/**
 * OAuth routes — `/api/auth/oauth/:provider/start` and
 * `/api/auth/oauth/:provider/callback`.
 *
 * Both endpoints are GETs:
 *   - `start`     — issues a state cookie and 302s to the provider
 *   - `callback`  — provider 302s back with `code` and `state`
 *
 * They are exempt from CSRF (which only fires on unsafe methods). The
 * state cookie is the CSRF defence.
 */
import express from 'express'
import { start, callback } from '../controllers/oauthController.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Apply auth limiter to /start (publicly callable, but rate-limited
// to prevent brute-forcing the state cookie space). Skip on /callback:
// it's only ever hit by the provider, so a limit just adds a
// foot-gun for legitimate users.
router.get('/:provider/start', authRateLimiter, start)
router.get('/:provider/callback', callback)

export default router
