import express from 'express'
import { start, callback } from '../controllers/oauthController.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.get('/:provider/start', authRateLimiter, start)
router.get('/:provider/callback', callback)

export default router
