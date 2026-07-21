import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { globalRateLimiter } from '../middleware/rateLimiter.js'
import { validate, roadmapProgressValidation } from '../middleware/validation.js'
import { getRoadmap, updateTopicProgress, resetRoadmap } from '../controllers/roadmapController.js'

const router = Router()
router.use(protect, globalRateLimiter)

router.get('/', getRoadmap)
router.put('/progress', roadmapProgressValidation, validate, updateTopicProgress)
router.post('/reset', resetRoadmap)

export default router
