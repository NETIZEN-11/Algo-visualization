import express from 'express'
import {
  getDashboard,
  getStatistics,
  getBadges,
  getStreak,
  getLeaderboard,
  getUserRank,
  getActivityHeatmap,
  getReadinessScore,
  updateXP,
} from '../controllers/progressController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/dashboard', protect, getDashboard)
router.get('/statistics', protect, getStatistics)
router.get('/badges', protect, getBadges)
router.get('/streak', protect, getStreak)
router.get('/leaderboard', protect, getLeaderboard)
router.get('/rank', protect, getUserRank)
router.get('/heatmap', protect, getActivityHeatmap)
router.get('/readiness', protect, getReadinessScore)
router.post('/xp', protect, updateXP)

export default router
