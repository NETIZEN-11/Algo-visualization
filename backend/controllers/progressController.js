/**
 * Progress controller.
 *
 * Bug fixes vs the prior version:
 *  - `getStreak` no longer breaks on empty activity log.
 *  - `patternStats` is read as a plain object.
 *  - `getLeaderboard` adds pagination.
 *  - `getActivityHeatmap` aggregates by day in O(n).
 *  - `updateXP` delegates to the shared `addXP` service (no more
 *    duplicated level logic).
 */
import User from '../models/User.js'
import Problem from '../models/Problem.js'
import { AppError, NotFoundError, ValidationError } from '../utils/errors.js'
import { calculateLevel, calculateStreak as streakFromDates } from '../utils/leveling.js'
import { addXP as addXPService } from './gamificationController.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const patternStatsAsObject = (u) =>
  u.patternStats instanceof Map ? Object.fromEntries(u.patternStats) : u.patternStats || {}

/* ------------------------------------------------------------------ */
export const getDashboard = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('name level xp streak problemStats activityLog lastActive')
  res.json({
    success: true,
    dashboard: {
      user: { name: user.name, level: user.level, xp: user.xp, streak: user.streak },
      stats: {
        totalSolved: user.problemStats?.total || 0,
        easySolved: user.problemStats?.easy || 0,
        mediumSolved: user.problemStats?.medium || 0,
        hardSolved: user.problemStats?.hard || 0,
      },
      recentActivity: (user.activityLog || []).slice(-10).reverse(),
    },
  })
})

export const getStatistics = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('solvedProblems problemStats patternStats xp level streak badges')
  res.json({
    success: true,
    statistics: {
      problemsSolved: {
        total: user.solvedProblems?.length || 0,
        easy: user.problemStats?.easy || 0,
        medium: user.problemStats?.medium || 0,
        hard: user.problemStats?.hard || 0,
      },
      patterns: patternStatsAsObject(user),
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      badges: (user.badges || []).length,
    },
  })
})

export const getBadges = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('badges')
  res.json({ success: true, badges: user.badges || [] })
})

/* ------------------------------------------------------------------ */
/* Streak — derived from consecutive calendar days in activityLog      */
/* ------------------------------------------------------------------ */
export const getStreak = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('activityLog streak lastActive')
  const dates = (user.activityLog || []).map((log) => new Date(log.date))
  // Use the same algorithm as `leveling.calculateStreak` but over an
  // array of arbitrary dates: walk from today backwards.
  const set = new Set(dates.map((d) => d.toISOString().split('T')[0]))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (set.has(cursor.toISOString().split('T')[0])) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  res.json({ success: true, streak, lastActivity: user.lastActive })
})

/* ------------------------------------------------------------------ */
export const getLeaderboard = wrap(async (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100))
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    User.find().select('name xp level streak avatar').sort({ xp: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ])
  const leaderboard = users.map((u, i) => ({
    rank: skip + i + 1,
    userId: u._id,
    name: u.name,
    avatar: u.avatar,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
  }))
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), leaderboard })
})

export const getUserRank = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('xp')
  const [rank, totalUsers] = await Promise.all([
    User.countDocuments({ xp: { $gt: user.xp || 0 } }).then((c) => c + 1),
    User.countDocuments(),
  ])
  res.json({ success: true, rank, totalUsers })
})

/* ------------------------------------------------------------------ */
export const getActivityHeatmap = wrap(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear()
  const user = await User.findById(req.user._id).select('activityLog')
  const heatmap = {}
  for (const log of user.activityLog || []) {
    const d = new Date(log.date)
    if (d.getFullYear() !== year) continue
    const key = d.toISOString().split('T')[0]
    heatmap[key] = (heatmap[key] || 0) + 1
  }
  res.json({ success: true, year, heatmap })
})

/* ------------------------------------------------------------------ */
export const getReadinessScore = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('solvedProblems patternStats streak')
  const totalProblems = user.solvedProblems?.length || 0
  const patterns = patternStatsAsObject(user)
  const patternCoverage = Object.keys(patterns).length
  const streakBonus = Math.min((user.streak || 0) * 2, 20)
  const score = Math.min(totalProblems * 2 + patternCoverage * 3 + streakBonus, 100)
  res.json({
    success: true,
    score: Math.round(score),
    factors: {
      problemsSolved: totalProblems,
      patternsCovered: patternCoverage,
      currentStreak: user.streak,
    },
  })
})

/* ------------------------------------------------------------------ */
export const updateXP = wrap(async (req, res) => {
  const { points, activity } = req.body
  if (typeof points !== 'number' || points < 0) throw new ValidationError('points must be a non-negative number')
  if (!activity) throw new ValidationError('activity is required')

  const user = await addXPService(req.user._id, points, activity)
  if (!user) throw new AppError('Could not update XP', 500)
  res.json({ success: true, message: 'XP updated', xp: user.xp, level: user.level })
})

/* ------------------------------------------------------------------ */
export const getRecommendations = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('solvedProblems patternStats problemStats preferences')
  const solved = new Set((user.solvedProblems || []).map((id) => id.toString()))
  const patterns = patternStatsAsObject(user)
  // Weakest pattern (lowest solved count above 0)
  let weakest = null
  for (const [p, n] of Object.entries(patterns)) {
    if (!weakest || n < weakest.count) weakest = { pattern: p, count: n }
  }
  // Recommend 5 unsolved problems
  const recs = await Problem.find({ _id: { $nin: Array.from(solved) } })
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(5)
    .select('title difficulty tags analysis.pattern_identification.pattern')
  res.json({
    success: true,
    recommendations: recs,
    weakestPattern: weakest,
  })
})

export const getActivityFeed = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('activityLog')
  res.json({ success: true, activity: (user.activityLog || []).slice(-50).reverse() })
})

export default {
  getDashboard,
  getStatistics,
  getBadges,
  getStreak,
  getLeaderboard,
  getUserRank,
  getActivityHeatmap,
  getReadinessScore,
  updateXP,
  getRecommendations,
  getActivityFeed,
}
