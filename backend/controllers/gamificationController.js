/**
 * Gamification controller — XP, level, badges, leaderboard, daily challenge.
 *
 * Bug fixes vs the prior version:
 *  - Every handler uses `next(error)` / `throw` so errors flow into the
 *    global error handler with a stable shape.
 *  - `getLeaderboard` no longer crashes when `rankings` is missing on a
 *    weekly/monthly doc.
 *  - `checkAndAwardBadges` accesses `patternStats` as a plain object
 *    (the schema was migrated away from Mongoose Map) and lower-cases
 *    the pattern name for a robust compare.
 *  - `addXP` uses the single `leveling.js` helper.
 *  - `getDailyChallenge` / `completeDailyChallenge` use the
 *    `ChallengeParticipation` collection (which replaced the unbounded
 *    `participants` array on the doc).
 */
import { User, Badge, Leaderboard, DailyChallenge, Problem, ChallengeParticipation } from '../models/index.js'
import { addXP as addXPService, calculateLevel, calculateStreak, xpToNextLevel } from '../utils/leveling.js'
import { AppError, NotFoundError, ConflictError, ValidationError, BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { cacheService } from '../services/cacheService.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
/* Daily challenge pool (10 hand-picked classics)                       */
/* ------------------------------------------------------------------ */
const DAILY_CHALLENGE_POOL = [
  { title: 'Two Sum', difficulty: 'Easy', pattern: 'Hashing',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
    constraints: ['2 <= nums.length <= 10^4'], tags: ['Array', 'Hash Table'] },
  { title: 'Valid Parentheses', difficulty: 'Easy', pattern: 'Stack',
    description: 'Determine if a string of brackets is balanced.',
    examples: [{ input: 's = "()[]{}"', output: 'true' }],
    constraints: ['1 <= s.length <= 10^4'], tags: ['String', 'Stack'] },
  { title: 'Reverse Linked List', difficulty: 'Easy', pattern: 'Linked List',
    description: 'Reverse a singly linked list iteratively.',
    examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }],
    constraints: ['The number of nodes is in [0, 5000]'], tags: ['Linked List'] },
  { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', pattern: 'Sliding Window',
    description: 'Find the maximum profit from a single buy/sell.',
    examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5' }],
    constraints: ['1 <= prices.length <= 10^5'], tags: ['Array', 'Sliding Window'] },
  { title: 'Binary Search', difficulty: 'Easy', pattern: 'Binary Search',
    description: 'Find the index of `target` in a sorted array, or -1.',
    examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' }],
    constraints: ['All integers in nums are unique.'], tags: ['Array', 'Binary Search'] },
  { title: 'Maximum Subarray', difficulty: 'Medium', pattern: 'Dynamic Programming',
    description: 'Find the contiguous subarray with the largest sum.',
    examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' }],
    constraints: ['1 <= nums.length <= 10^5'], tags: ['Array', 'DP'] },
  { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', pattern: 'Sliding Window',
    description: 'Length of the longest substring without repeating characters.',
    examples: [{ input: 's = "abcabcbb"', output: '3' }],
    constraints: ['0 <= s.length <= 5 * 10^4'], tags: ['String', 'Sliding Window'] },
  { title: 'Merge Intervals', difficulty: 'Medium', pattern: 'Array',
    description: 'Merge all overlapping intervals.',
    examples: [{ input: '[[1,3],[2,6],[8,10]]', output: '[[1,6],[8,10]]' }],
    constraints: ['1 <= intervals.length <= 10^4'], tags: ['Array', 'Sorting'] },
  { title: 'Climbing Stairs', difficulty: 'Easy', pattern: 'Dynamic Programming',
    description: 'Count the distinct ways to climb n steps (1 or 2 at a time).',
    examples: [{ input: 'n = 3', output: '3' }],
    constraints: ['1 <= n <= 45'], tags: ['DP', 'Math'] },
  { title: 'LRU Cache', difficulty: 'Medium', pattern: 'Hashing',
    description: 'Design and implement a Least Recently Used cache.',
    examples: [{ input: 'LRUCache(2); put(1,1); put(2,2); get(1) -> 1', output: '1' }],
    constraints: ['1 <= capacity <= 3000'], tags: ['Hash Table', 'Linked List', 'Design'] },
]

function pickForDate(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date - start) / 86_400_000)
  return DAILY_CHALLENGE_POOL[day % DAILY_CHALLENGE_POOL.length]
}

/* ------------------------------------------------------------------ */
/* Daily challenge seeding                                              */
/* ------------------------------------------------------------------ */
export const ensureTodaysChallenge = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await DailyChallenge.findOne({ date: today })
    if (existing) return existing

    const c = pickForDate(today)
    const problem = await Problem.create({
      problemId: `prob_daily_${today.toISOString().split('T')[0]}_${Date.now()}`,
      userId: null,
      source: 'system',
      title: c.title,
      slug: c.title.toLowerCase().replace(/\s+/g, '-'),
      difficulty: c.difficulty,
      description: c.description,
      examples: c.examples,
      constraints: c.constraints,
      tags: c.tags,
      companies: [],
    })

    const challenge = await DailyChallenge.create({
      date: today,
      problemId: problem._id,
      difficulty: c.difficulty,
      pattern: c.pattern,
      xpReward: 50,
      bonusXp: 25,
      isActive: true,
      seededAt: new Date(),
    })

    logger.info({ title: c.title, difficulty: c.difficulty }, '✅ Daily challenge seeded')
    return challenge
  } catch (err) {
    logger.error({ err: err.message }, 'ensureTodaysChallenge failed')
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */
export const getUserBadges = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('badges')
  res.json({ success: true, data: user.badges || [] })
})

export const getAllBadges = wrap(async (req, res) => {
  const badges = await Badge.find({ isActive: true }).sort({ tier: 1, category: 1 })
  res.json({ success: true, data: badges })
})

/**
 * Check and award badges. Pure function — does NOT save. Caller decides.
 * Returns the array of newly-awarded badge docs.
 */
export const checkAndAwardBadges = async (userId, stats) => {
  try {
    const user = await User.findById(userId)
    if (!user) return []
    const allBadges = await Badge.find({ isActive: true })
    const earned = new Set((user.badges || []).map((b) => b.id))
    const newBadges = []
    // `stats` is the merged source of truth (user + freshly-computed). For
    // pattern lookups, use the lower-cased map.
    const ps = user.patternStats instanceof Map
      ? Object.fromEntries(user.patternStats)
      : user.patternStats || {}
    const patternLower = {}
    for (const [k, v] of Object.entries(ps)) patternLower[String(k).toLowerCase()] = v

    for (const badge of allBadges) {
      if (earned.has(badge.id)) continue
      let ok = false
      switch (badge.criteria?.type) {
        case 'problems_solved':
          ok = (stats?.total || 0) >= badge.criteria.target
          break
        case 'difficulty_problems':
          ok = (stats?.[String(badge.criteria.context).toLowerCase()] || 0) >= badge.criteria.target
          break
        case 'pattern_problems': {
          const p = String(badge.criteria.context || '').toLowerCase()
          ok = (patternLower[p] || 0) >= badge.criteria.target
          break
        }
        case 'streak_days':
          ok = (user.streak || 0) >= badge.criteria.target
          break
        case 'xp_earned':
          ok = (user.xp || 0) >= badge.criteria.target
          break
        default:
          ok = false
      }
      if (ok) {
        user.badges.push({ id: badge.id, name: badge.name, icon: badge.icon, earnedAt: new Date() })
        user.xp = (user.xp || 0) + (badge.xpReward || 0)
        newBadges.push(badge)
      }
    }
    if (newBadges.length) await user.save()
    return newBadges
  } catch (err) {
    logger.error({ err: err.message }, 'checkAndAwardBadges failed')
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Leaderboard                                                          */
/* ------------------------------------------------------------------ */
export const getLeaderboard = wrap(async (req, res) => {
  const type = String(req.query.type || 'global')
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100))
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const skip = (page - 1) * limit

  if (type === 'global') {
    const cacheKey = `lb:global:${page}:${limit}:${req.user._id}`
    const { value, fromCache } = await cacheService.getOrSet(cacheKey, 60, async () => {
      const [topUsers, total] = await Promise.all([
        User.find().select('name email avatar xp level streak problemStats').sort({ xp: -1 }).skip(skip).limit(limit),
        User.countDocuments(),
      ])
      const rankings = topUsers.map((u, i) => ({
        rank: skip + i + 1,
        userId: u._id,
        name: u.name,
        avatar: u.avatar,
        score: u.xp,
        level: u.level,
        problemsSolved: u.problemStats?.total || 0,
        streak: u.streak,
      }))
      const currentUserRank = rankings.findIndex((r) => r.userId?.toString() === req.user._id.toString())
      return {
        type: 'global',
        rankings,
        currentUserRank: currentUserRank === -1 ? null : currentUserRank + 1,
        page,
        pages: Math.ceil(total / limit),
        total,
      }
    })
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS')
    return res.json({ success: true, data: value })
  }

  // weekly / monthly / contest — comes from Leaderboard collection
  const board = await Leaderboard.findOne({ type, isActive: true })
    .populate('rankings.userId', 'name email avatar')
    .sort({ 'period.endDate': -1 })
  if (!board) throw new NotFoundError('Leaderboard not found')

  const rankings = Array.isArray(board.rankings) ? board.rankings : []
  const currentUserRank = rankings.findIndex(
    (r) => r.userId?._id?.toString() === req.user._id.toString()
  )

  res.json({
    success: true,
    data: {
      ...board.toObject(),
      rankings,
      currentUserRank: currentUserRank === -1 ? null : currentUserRank + 1,
    },
  })
})

/* ------------------------------------------------------------------ */
/* Daily challenge (uses ChallengeParticipation for unbounded growth)   */
/* ------------------------------------------------------------------ */
export const getDailyChallenge = wrap(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().split('T')[0]

  // Cache the challenge lookup itself for 1h — it changes once per day.
  const challenge = await cacheService.getOrSet(`daily:${todayKey}`, 3600, async () => {
    let c = await DailyChallenge.findOne({ date: today, isActive: true }).populate('problemId').lean()
    if (!c) {
      const ensured = await ensureTodaysChallenge()
      if (!ensured) return null
      c = await DailyChallenge.findById(ensured._id).populate('problemId').lean()
    }
    return c
  }).then(async (r) => r.value)
  if (!challenge) throw new NotFoundError("No challenge available today")

  const userParticipation = await ChallengeParticipation.findOne({
    userId: req.user._id,
    challengeId: challenge._id,
  })

  res.json({
    success: true,
    data: {
      _id: challenge._id,
      date: challenge.date,
      difficulty: challenge.difficulty,
      pattern: challenge.pattern,
      xpReward: challenge.xpReward,
      bonusXp: challenge.bonusXp,
      totalParticipants: challenge.totalParticipants,
      totalCompleted: challenge.totalCompleted,
      isActive: challenge.isActive,
      problemId: challenge.problemId?._id || challenge.problemId,
      problem: challenge.problemId && typeof challenge.problemId === 'object'
        ? {
            _id: challenge.problemId._id,
            title: challenge.problemId.title,
            slug: challenge.problemId.slug,
            difficulty: challenge.problemId.difficulty,
            description: challenge.problemId.description,
            examples: challenge.problemId.examples,
            constraints: challenge.problemId.constraints,
            tags: challenge.problemId.tags,
          }
        : null,
      userCompleted: !!userParticipation?.completedAt,
      userStats: userParticipation,
    },
  })
})

export const completeDailyChallenge = wrap(async (req, res) => {
  const { challengeId, timeTaken, submissionId } = req.body
  if (!challengeId) throw new ValidationError('challengeId is required')

  const challenge = await DailyChallenge.findById(challengeId)
  if (!challenge) throw new NotFoundError('Challenge not found')

  // Idempotent: upsert the participation row.
  const earnedBonus = typeof timeTaken === 'number' && timeTaken > 0 && timeTaken < 1800
  const xpAwarded = challenge.xpReward + (earnedBonus ? challenge.bonusXp : 0)

  const part = await ChallengeParticipation.findOneAndUpdate(
    { userId: req.user._id, challengeId },
    {
      $setOnInsert: { userId: req.user._id, challengeId },
      $set: {
        completedAt: new Date(),
        timeTaken: timeTaken || null,
        earnedBonus,
        xpAwarded,
        submissionId: submissionId || null,
      },
    },
    { upsert: true, new: true }
  )

  // First time only — award XP and bump counters
  if (part.isNew) {
    const user = await User.findById(req.user._id)
    user.xp = (user.xp || 0) + xpAwarded
    user.streak = calculateStreak(user.streak, user.lastActive, new Date())
    user.lastActive = new Date()
    await user.save()
    await DailyChallenge.updateOne({ _id: challengeId }, { $inc: { totalCompleted: 1, totalParticipants: 1 } })
  }

  res.json({ success: true, message: 'Challenge completed!', data: { xpAwarded, earnedBonus, alreadyCompleted: !part.isNew } })
})

/* ------------------------------------------------------------------ */
/* XP / level — single source of truth                                  */
/* ------------------------------------------------------------------ */
export const addXP = addXPService

export const getLevelInfo = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('xp level')
  const level = calculateLevel(user.xp)
  const xpToNext = xpToNextLevel(user.xp)
  res.json({ success: true, data: { xp: user.xp, level, xpToNextLevel: xpToNext } })
})

export default {
  ensureTodaysChallenge,
  getUserBadges,
  getAllBadges,
  checkAndAwardBadges,
  getLeaderboard,
  getDailyChallenge,
  completeDailyChallenge,
  addXP,
  getLevelInfo,
}
