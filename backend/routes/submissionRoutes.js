import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { globalRateLimiter, aiRateLimiter } from '../middleware/rateLimiter.js'
import { validate, submissionValidation } from '../middleware/validation.js'
import { createSubmission, listSubmissions, getSubmission } from '../controllers/submissionController.js'

const router = Router()
router.use(protect, globalRateLimiter, aiRateLimiter)

router.get('/', listSubmissions)
router.get('/:id', getSubmission)
router.post('/', submissionValidation, validate, createSubmission)

export default router
