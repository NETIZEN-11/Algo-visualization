import { UserProgress, User, Problem, Interview } from '../models/index.js'
import { calculateInterviewReadinessWithAI } from '../services/aiService.js'
import { NotFoundError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export const getUserAnalytics = wrap(async (req, res) => {
  const userId = req.user._id
  let progress = await UserProgress.findOne({ userId })
  if (!progress) {
    const user = await User.findById(userId).select('streak')
    progress = await UserProgress.create({
      userId,
      overallStats: {
        totalProblemsSolved: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        currentStreak: user?.streak || 0,
        longestStreak: user?.streak || 0,
        lastActiveDate: new Date(),
      },
    })
  }
  const user = await User.findById(userId).select('xp level streak badges problemStats')
  res.json({ success: true, data: { progress, user } })
})

export const updateProgress = async (user, problemData, timeTaken = 0, isCorrect = true) => {
  try {
    if (!user) return null
    let progress = await UserProgress.findOne({ userId: user._id })
    if (!progress) {
      progress = new UserProgress({ userId: user._id })
    }

    if (isCorrect) progress.overallStats.totalProblemsSolved += 1
    progress.overallStats.totalTimeSpent += timeTaken || 0
    progress.overallStats.lastActiveDate = new Date()
    progress.overallStats.currentStreak = user.streak || 0
    progress.overallStats.longestStreak = Math.max(
      progress.overallStats.longestStreak || 0,
      user.streak || 0
    )

    const difficulty = (problemData?.difficulty || 'medium').toLowerCase()
    if (progress.difficultyBreakdown?.[difficulty]) {
      progress.difficultyBreakdown[difficulty].attempted += 1
      if (isCorrect) progress.difficultyBreakdown[difficulty].solved += 1
      const d = progress.difficultyBreakdown[difficulty]
      d.accuracy = d.attempted > 0 ? (d.solved / d.attempted) * 100 : 0
    }

    const pattern = String(problemData?.pattern || problemData?.analysis?.pattern_identification?.pattern || 'general').toLowerCase()
    let entry = progress.patternMastery.find((p) => p.pattern === pattern)
    if (!entry) {
      entry = {
        pattern,
        problemsSolved: 0,
        problemsAttempted: 0,
        accuracy: 0,
        averageTime: 0,
        masteryLevel: 'beginner',
        lastPracticedAt: new Date(),
      }
      progress.patternMastery.push(entry)
    }
    entry.problemsAttempted += 1
    if (isCorrect) entry.problemsSolved += 1
    entry.accuracy = entry.problemsAttempted > 0 ? (entry.problemsSolved / entry.problemsAttempted) * 100 : 0
    if (entry.problemsSolved >= 20) entry.masteryLevel = 'expert'
    else if (entry.problemsSolved >= 10) entry.masteryLevel = 'advanced'
    else if (entry.problemsSolved >= 5) entry.masteryLevel = 'intermediate'
    entry.lastPracticedAt = new Date()

    const currentWeek = getStartOfWeek(new Date())
    let week = progress.weeklyActivity.find((w) => new Date(w.week).toDateString() === currentWeek.toDateString())
    if (!week) {
      week = { week: currentWeek, problemsSolved: 0, timeSpent: 0, xpEarned: 0, dailyActivity: [] }
      progress.weeklyActivity.push(week)
    }
    if (isCorrect) week.problemsSolved += 1
    week.timeSpent += timeTaken || 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let daily = week.dailyActivity.find((d) => new Date(d.date).toDateString() === today.toDateString())
    if (!daily) {
      daily = { date: today, problemsSolved: 0, timeSpent: 0 }
      week.dailyActivity.push(daily)
    }
    if (isCorrect) daily.problemsSolved += 1
    daily.timeSpent += timeTaken || 0

    if (progress.weeklyActivity.length > 12) {
      progress.weeklyActivity = progress.weeklyActivity.slice(-12)
    }

    const totalAttempts = Object.values(progress.difficultyBreakdown).reduce((s, d) => s + (d.attempted || 0), 0)
    const totalSolved = Object.values(progress.difficultyBreakdown).reduce((s, d) => s + (d.solved || 0), 0)
    progress.overallStats.averageAccuracy = totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0

    await progress.save()
    return progress
  } catch (err) {
    logger.error({ err: err.message }, 'updateProgress failed')
    return null
  }
}

export const getInterviewReadiness = wrap(async (req, res) => {
  const user = await User.findById(req.user._id)
  const solvedProblems = await Problem.find({ _id: { $in: user.solvedProblems } })
    .select('difficulty tags analysis.pattern_identification.pattern')

  const interviews = await Interview.find({ userId: req.user._id, status: 'completed' })
    .select('systemDesignScore score interviewType')
  let systemDesignScore = 0
  const sdScores = interviews
    .map((i) => (i.systemDesignScore && i.systemDesignScore > 0 ? i.systemDesignScore : null))
    .filter((s) => typeof s === 'number')
  if (sdScores.length) {
    systemDesignScore = sdScores.reduce((a, b) => a + b, 0) / sdScores.length
  } else {

    const sd = interviews.filter((i) => i.interviewType === 'system-design')
    if (sd.length) {
      systemDesignScore = sd.reduce((s, i) => s + (i.score || 0), 0) / sd.length
    }
  }

  const patternStats = user.patternStats instanceof Map
    ? Object.fromEntries(user.patternStats)
    : user.patternStats || {}

  const userStats = {
    totalProblemsSolved: user.problemStats?.total || 0,
    easy: user.problemStats?.easy || 0,
    medium: user.problemStats?.medium || 0,
    hard: user.problemStats?.hard || 0,
    patternStats,
    systemDesignScore,
  }

  const readiness = await calculateInterviewReadinessWithAI(userStats, solvedProblems)

  const finalScore = { ...readiness, system_design_score: Math.round(systemDesignScore) }

  const progress = await UserProgress.findOne({ userId: req.user._id })
  if (progress) {
    progress.interviewReadinessScore = {
      overall: readiness.overall_score,
      dataStructures: readiness.data_structures_score,
      algorithms: readiness.algorithms_score,
      problemSolving: readiness.problem_solving_score,
      systemDesign: Math.round(systemDesignScore),
      lastCalculated: new Date(),
    }
    if (Array.isArray(readiness.recommendations)) {
      progress.recommendations = readiness.recommendations.map((r) => ({
        type: 'weak_topic',
        message: r,
        priority: 'medium',
        createdAt: new Date(),
      }))
    }
    await progress.save()
  }

  res.json({ success: true, data: finalScore })
})

export const getTopicAnalysis = wrap(async (req, res) => {
  const progress = await UserProgress.findOne({ userId: req.user._id })
  if (!progress) throw new NotFoundError('Progress data not found')

  const weakTopics = (progress.patternMastery || [])
    .filter((p) => p.accuracy < 50 || p.masteryLevel === 'beginner')
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)

  const strongTopics = (progress.patternMastery || [])
    .filter((p) => p.accuracy >= 75 && p.problemsSolved >= 5)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)

  res.json({
    success: true,
    data: {
      weakTopics,
      strongTopics,
      recommendations: progress.recommendations || [],
    },
  })
})

function getStartOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export default {
  getUserAnalytics,
  updateProgress,
  getInterviewReadiness,
  getTopicAnalysis,
}
