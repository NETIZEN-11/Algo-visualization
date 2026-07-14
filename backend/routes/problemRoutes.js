import express from 'express'
import {
  scrapeProblem,
  analyzeProblem,
  getProblem,
  getUserProblems,
  saveProblem,
  getVisualization,
  getCodeSolutions,
  getHints,
  analyzeCode,
  generateTestCases,
  executeDryRun,
  getRelatedProblems,
  searchByCompany,
  getByPattern,
  markSolved,
} from '../controllers/problemController.js'
import { protect } from '../middleware/auth.js'
import { problemAnalysisValidation, validate } from '../middleware/validation.js'
import { strictRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/scrape', protect, strictRateLimiter, scrapeProblem)
router.post('/analyze', protect, strictRateLimiter, problemAnalysisValidation, validate, analyzeProblem)
// /analyze-code must be registered BEFORE /:id so Express doesn't treat
// the literal string "analyze-code" as a problem ID.
router.post('/analyze-code', protect, strictRateLimiter, analyzeCode)
router.get('/user', protect, getUserProblems)
router.get('/company/:company', protect, searchByCompany)
router.get('/pattern/:pattern', protect, getByPattern)
router.get('/:id', protect, getProblem)
router.post('/:id/save', protect, saveProblem)
router.post('/:id/solve', protect, markSolved)
router.get('/:id/visualization', protect, getVisualization)
router.get('/:id/solutions', protect, getCodeSolutions)
router.post('/:id/hints', protect, getHints)
router.post('/:id/test-cases', protect, generateTestCases)
router.post('/:id/dry-run', protect, executeDryRun)
router.get('/:id/related', protect, getRelatedProblems)

export default router
