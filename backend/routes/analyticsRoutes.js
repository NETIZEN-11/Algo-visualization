import express from 'express'
import {
  getUserAnalytics,
  getInterviewReadiness,
  getTopicAnalysis,
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.get('/', getUserAnalytics)
router.get('/interview-readiness', getInterviewReadiness)
router.get('/topics', getTopicAnalysis)

export default router
