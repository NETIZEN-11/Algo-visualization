import { Router } from 'express'
import { fromText, fromProblem, classify } from '../controllers/visualizeController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// All endpoints are usable while signed out — no PII is touched.
router.post('/from-text', optionalAuth, fromText)
router.post('/from-problem/:id', optionalAuth, fromProblem)
router.post('/pattern', optionalAuth, classify)

export default router
