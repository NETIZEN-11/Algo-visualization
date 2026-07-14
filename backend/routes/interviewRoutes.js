import express from 'express'
import {
  startInterview,
  submitAnswer,
  getNextQuestion,
  getFollowUpQuestion,
  endInterview,
  getInterview,
  getQuestionFeedback,
  getHistory,
  getStats,
} from '../controllers/interviewController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/start', protect, startInterview)
router.get('/history', protect, getHistory)
router.get('/stats', protect, getStats)
router.get('/:sessionId', protect, getInterview)
router.post('/:sessionId/answer', protect, submitAnswer)
router.get('/:sessionId/feedback/:questionId', protect, getQuestionFeedback)
router.post('/:sessionId/next', protect, getNextQuestion)
router.post('/:sessionId/followup', protect, getFollowUpQuestion)
router.post('/:sessionId/end', protect, endInterview)

export default router
