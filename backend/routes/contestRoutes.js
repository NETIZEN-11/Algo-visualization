import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { globalRateLimiter, aiRateLimiter } from '../middleware/rateLimiter.js'
import { validate, contestSubmitValidation } from '../middleware/validation.js'
import {
  listContests, getContest, registerForContest, submitToContest, getContestLeaderboard,
} from '../controllers/contestController.js'

const router = Router()

router.get('/', globalRateLimiter, listContests)
router.get('/:id', globalRateLimiter, getContest)
router.get('/:id/leaderboard', globalRateLimiter, getContestLeaderboard)

router.post('/:id/register', protect, globalRateLimiter, registerForContest)
router.post('/:id/submit', protect, globalRateLimiter, aiRateLimiter, contestSubmitValidation, validate, submitToContest)

export default router
