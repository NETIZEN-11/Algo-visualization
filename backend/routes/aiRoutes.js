import express from 'express'
import {
  getHints,
  detectBugs,
  generateTestCases,
  generateDryRun,
  explainConcept,
  chatWithTutor,
  compareApproaches,
} from '../controllers/aiController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.post('/hints', getHints)
router.post('/detect-bugs', detectBugs)
router.post('/test-cases', generateTestCases)
router.post('/dry-run', generateDryRun)
router.post('/explain-concept', explainConcept)
router.post('/chat', chatWithTutor)
router.post('/compare-approaches', compareApproaches)

export default router
