/**
 * Playground routes — `/api/playground`
 *
 * Untrusted code execution is heavily rate-limited (aiRateLimiter) and
 * requires authentication so we can correlate abuse to a user.
 */
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { globalRateLimiter, aiRateLimiter } from '../middleware/rateLimiter.js'
import { validate, playgroundExecuteValidation } from '../middleware/validation.js'
import { execute, getRuntimes } from '../controllers/playgroundController.js'

const router = Router()

router.get('/runtimes', protect, globalRateLimiter, getRuntimes)
router.post('/execute', protect, globalRateLimiter, aiRateLimiter, playgroundExecuteValidation, validate, execute)

export default router
