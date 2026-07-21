/**
 * Problem controller.
 *
 * The source of truth for "solved" lives in `User.solvedProblems` and the
 * `Submission` collection — not on the Problem document. `markSolved`
 * updates the user, awards XP, and (best-effort) keeps `UserProgress`
 * in sync.
 *
 * Ownership: any time a single problem is addressed by `:id`, the requester
 * must either own it or it must be a system-owned (curated) one. The
 * `loadOwnedProblem` helper enforces this in one place.
 */
import Problem from '../models/Problem.js'
import User from '../models/User.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { assertOwner } from '../utils/ownership.js'
import {
  analyzeProblemWithAI,
  generateHintsWithAI,
  analyzeCodeWithAI,
  generateTestCasesWithAI,
  generateDryRunWithAI,
} from '../services/aiService.js'
import { scrapeLeetCodeProblem } from '../services/scraperService.js'
import { generateProblemId } from '../utils/helpers.js'
import { XP_REWARDS } from '../utils/constants.js'
import { updateProgress } from './analyticsController.js'
import { logger } from '../utils/logger.js'
import { calculateLevel, calculateStreak } from '../utils/leveling.js'

const DIFFICULTY_KEY = { Easy: 'easy', Medium: 'medium', Hard: 'hard' }

/** Pagination parser. Returns { page, limit, skip }. */
const pagination = (q, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(q.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(q.limit, 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

/** Wrap an async route handler so thrown errors hit the global handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** Load a Problem by its public id and assert the requester owns it.
 *  System-owned problems (userId === null) are accessible to all. */
const loadOwnedProblem = async (problemId, userId) => {
  const problem = await Problem.findOne({ problemId })
  if (!problem) throw new NotFoundError('Problem not found')
  assertOwner(problem, userId)
  return problem
}

/* ------------------------------------------------------------------ */
/* Scrape                                                              */
/* ------------------------------------------------------------------ */
export const scrapeProblem = wrap(async (req, res) => {
  const { url } = req.body
  if (!url) throw new ValidationError('URL is required')
  const problemData = await scrapeLeetCodeProblem(url)
  res.json({ success: true, data: problemData })
})

/* ------------------------------------------------------------------ */
/* Analyse + persist                                                   */
/* ------------------------------------------------------------------ */
export const analyzeProblem = wrap(async (req, res) => {
  const { problemData } = req.body
  if (!problemData?.title || !problemData?.description) {
    throw new ValidationError('Problem data with title and description is required')
  }

  const analysis = await analyzeProblemWithAI(problemData)

  const problem = await Problem.create({
    problemId: generateProblemId(),
    userId: req.user._id,
    source: problemData.url ? 'leetcode' : 'manual',
    leetcodeId: problemData.leetcodeId || null,
    title: problemData.title,
    slug: problemData.slug || null,
    difficulty: problemData.difficulty || 'Medium',
    description: problemData.description,
    examples: problemData.examples || [],
    constraints: problemData.constraints || [],
    tags: problemData.tags || [],
    companies: problemData.companies || [],
    likes: problemData.likes || 0,
    dislikes: problemData.dislikes || 0,
    analysis,
  })

  res.status(201).json({
    success: true,
    message: 'Problem analyzed successfully',
    data: analysis,
    problemId: problem.problemId,
  })
})

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */
export const getProblem = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  // Bump views (fire and forget — don't slow the response, but DO log on
  // failure so the dev knows the counter stopped incrementing).
  Problem.updateOne({ _id: problem._id }, { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } })
    .catch((err) => logger.warn({ err: err.message, problemId: problem.problemId }, 'view bump failed'))

  // Whether the current user has solved it. We look it up here instead of
  // returning a stale `isSolved` boolean on the Problem doc.
  const solved = await User.exists({ _id: req.user._id, solvedProblems: problem._id })

  res.json({
    success: true,
    problem: { ...problem.toObject(), userSolved: !!solved },
  })
})

export const getUserProblems = wrap(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, { defaultLimit: 20 })
  const [problems, total] = await Promise.all([
    Problem.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Problem.countDocuments({ userId: req.user._id }),
  ])
  res.json({ success: true, count: problems.length, total, page, pages: Math.ceil(total / limit), problems })
})

export const saveProblem = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedProblems: problem._id },
  })

  res.json({ success: true, message: 'Problem saved successfully', saved: true })
})

export const unsaveProblem = wrap(async (req, res) => {
  // We don't need the problem doc to remove it from the user's list; we
  // only need the user's id. But we DO want to make sure the problem
  // exists, to avoid silent typos in the URL.
  await loadOwnedProblem(req.params.id, req.user._id)

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedProblems: await Problem.findOne({ problemId: req.params.id }).select('_id').then((p) => p?._id) },
  })

  res.json({ success: true, message: 'Problem removed from saved', saved: false })
})

export const getVisualization = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)
  res.json({ success: true, visualization: problem.analysis?.visualization || {} })
})

export const getCodeSolutions = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)
  res.json({ success: true, solutions: problem.analysis?.code_solutions || {} })
})

export const getHints = wrap(async (req, res) => {
  const { hintLevel = 1, problemData } = req.body
  let problem = null
  if (req.params.id) {
    problem = await loadOwnedProblem(req.params.id, req.user._id)
  } else if (!problemData) {
    throw new NotFoundError('Problem not found')
  }

  const dataForAI = problemData || {
    title: problem.title,
    description: problem.description,
  }
  const result = await generateHintsWithAI(dataForAI, parseInt(hintLevel, 10))
  res.json({ success: true, hint: result.hint, level: result.level })
})

export const analyzeCode = wrap(async (req, res) => {
  const { code, language, problemId } = req.body
  if (!code || !language) throw new ValidationError('Code and language are required')

  let problemContext = ''
  if (problemId) {
    const problem = await loadOwnedProblem(problemId, req.user._id)
    problemContext = `${problem.title}: ${problem.description}`
  }

  const result = await analyzeCodeWithAI(code, language, problemContext)
  res.json({
    success: true,
    analysis: {
      feedback: result.analysis,
      hasErrors: result.hasErrors,
      suggestions: result.suggestions,
    },
  })
})

export const generateTestCases = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  const problemData = {
    title: problem.title,
    description: problem.description,
    constraints: problem.constraints,
    difficulty: problem.difficulty,
  }
  const result = await generateTestCasesWithAI(problemData)
  res.json({ success: true, data: result })
})

export const executeDryRun = wrap(async (req, res) => {
  const { code, customInput, language = 'python' } = req.body
  if (!code || !customInput) throw new ValidationError('Code and customInput are required')

  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  const result = await generateDryRunWithAI(
    { title: problem.title, description: problem.description },
    code,
    customInput,
    language
  )
  res.json({ success: true, data: result })
})

/* ------------------------------------------------------------------ */
/* Related / search                                                    */
/* ------------------------------------------------------------------ */
export const getRelatedProblems = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  const pattern = problem.analysis?.pattern_identification?.pattern
  if (!pattern) {
    return res.json({ success: true, problems: [] })
  }

  const relatedProblems = await Problem.find({
    'analysis.pattern_identification.pattern': pattern,
    _id: { $ne: problem._id },
  })
    .sort({ 'analysis.complexity_analysis.time_complexity': 1 })
    .limit(6)
  res.json({ success: true, problems: relatedProblems })
})

export const searchByCompany = wrap(async (req, res) => {
  const { company } = req.params
  const { page, limit, skip } = pagination(req.query, { defaultLimit: 20 })
  const filter = { companies: { $in: [new RegExp(`^${escapeRegex(company)}$`, 'i')] } }
  const [problems, total] = await Promise.all([
    Problem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Problem.countDocuments(filter),
  ])
  res.json({ success: true, count: problems.length, total, page, pages: Math.ceil(total / limit), problems })
})

export const getByPattern = wrap(async (req, res) => {
  const { pattern } = req.params
  const { page, limit, skip } = pagination(req.query, { defaultLimit: 20 })
  const filter = { 'analysis.pattern_identification.pattern': new RegExp(`^${escapeRegex(pattern)}$`, 'i') }
  const [problems, total] = await Promise.all([
    Problem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Problem.countDocuments(filter),
  ])
  res.json({ success: true, count: problems.length, total, page, pages: Math.ceil(total / limit), problems })
})

/* ------------------------------------------------------------------ */
/* Mark solved                                                          */
/* ------------------------------------------------------------------ */
export const markSolved = wrap(async (req, res) => {
  const problem = await loadOwnedProblem(req.params.id, req.user._id)

  const user = await User.findById(req.user._id)

  const alreadySolved = user.solvedProblems.some(
    (id) => id.toString() === problem._id.toString()
  )

  let xpEarned = 0
  if (!alreadySolved) {
    user.solvedProblems.push(problem._id)

    const diffKey = DIFFICULTY_KEY[problem.difficulty] || 'medium'
    user.problemStats[diffKey] = (user.problemStats[diffKey] || 0) + 1
    user.problemStats.total = (user.problemStats.total || 0) + 1

    // patternStats is a plain object — set via direct key access.
    const pattern = problem.analysis?.pattern_identification?.pattern
    if (pattern) {
      const key = pattern.toLowerCase()
      user.patternStats[key] = (user.patternStats[key] || 0) + 1
    }

    xpEarned = XP_REWARDS[problem.difficulty] || XP_REWARDS.Medium || 20
    user.xp = (user.xp || 0) + xpEarned
    user.level = Math.max(user.level || 1, calculateLevel(user.xp))
    user.streak = calculateStreak(user.streak, user.lastActive, new Date())
    user.lastActive = new Date()
    user.activityLog.push({
      activity: `Solved: ${problem.title}`,
      xp: xpEarned,
      date: new Date(),
    })

    await user.save()

    // Best-effort progress sync — don't fail the request if it errors.
    updateProgress(user, problem).catch(() => {})
  }

  res.json({
    success: true,
    message: alreadySolved ? 'Problem already solved' : 'Problem marked as solved',
    alreadySolved,
    xpEarned,
  })
})

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
