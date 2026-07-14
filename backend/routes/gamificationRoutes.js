import express from 'express'
import {
  getUserBadges,
  getAllBadges,
  getLeaderboard,
  getDailyChallenge,
  completeDailyChallenge,
  getLevelInfo,
} from '../controllers/gamificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.get('/badges', getUserBadges)
router.get('/badges/all', getAllBadges)
router.get('/leaderboard', getLeaderboard)
router.get('/level', getLevelInfo)
router.get('/daily-challenge', getDailyChallenge)
router.post('/daily-challenge/complete', completeDailyChallenge)

export default router
