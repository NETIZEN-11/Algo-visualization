import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { globalRateLimiter, aiRateLimiter } from '../middleware/rateLimiter.js'
import { validate, playgroundExecuteValidation } from '../middleware/validation.js'
import { execute, getRuntimes } from '../controllers/playgroundController.js'

const router = Router()

router.get('/runtimes', protect, globalRateLimiter, getRuntimes)
router.post('/execute', protect, globalRateLimiter, aiRateLimiter, playgroundExecuteValidation, validate, execute)

export default router
