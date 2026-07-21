/**
 * Submission controller — record and list.
 */
import { Submission, User, Problem } from '../models/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { awardXP } from '../utils/leveling.js'
import { calculateLevel } from '../utils/leveling.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
export const createSubmission = wrap(async (req, res) => {
  const { problemId, code, language, status, runtime, memory, testCasesPassed, testCasesTotal, difficulty } = req.body
  if (!problemId || !code || !language) throw new ValidationError('problemId, code, language are required')

  // Resolve the public problemId to an ObjectId before we do anything else.
  // The client may send either a public id ("prob_…") or an ObjectId hex.
  let problemDoc = null
  if (typeof problemId === 'string' && /^[a-f\d]{24}$/i.test(problemId)) {
    problemDoc = await Problem.findById(problemId)
  }
  if (!problemDoc) {
    problemDoc = await Problem.findOne({ problemId })
  }
  if (!problemDoc) throw new NotFoundError('Problem not found')

  const isAccepted = status === 'accepted'
  const sub = await Submission.create({
    userId: req.user._id,
    problemId: problemDoc._id,
    problemSlug: problemDoc.problemId,
    code,
    language,
    status: status || 'pending',
    runtime: runtime ?? null,
    memory: memory ?? null,
    testCasesPassed: testCasesPassed ?? 0,
    testCasesTotal: testCasesTotal ?? 0,
    isAccepted,
  })

  if (isAccepted) {
    const user = await User.findById(req.user._id)
    const alreadySolved = (user.solvedProblems || []).some(
      (id) => id.toString() === problemDoc._id.toString()
    )
    if (!alreadySolved) {
      user.solvedProblems.push(problemDoc._id)
      const diffKey = String(difficulty || problemDoc.difficulty || 'medium').toLowerCase()
      if (['easy', 'medium', 'hard'].includes(diffKey)) {
        user.problemStats[diffKey] = (user.problemStats[diffKey] || 0) + 1
      }
      user.problemStats.total = (user.problemStats.total || 0) + 1
      user.level = Math.max(user.level || 1, calculateLevel(user.xp))
      user.activityLog.push({
        activity: `Accepted: ${problemDoc.title}`,
        xp: 20,
        date: new Date(),
      })
      await user.save()
      await awardXP(req.user._id, 20, 'Accepted submission')
    }
  }

  res.status(201).json({ success: true, data: sub })
})

export const listSubmissions = wrap(async (req, res) => {
  const filter = { userId: req.user._id }
  if (req.query.problemId) filter.problemId = req.query.problemId
  if (req.query.status) filter.status = req.query.status
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
  const subs = await Submission.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('problemId', 'title difficulty')
  res.json({ success: true, count: subs.length, data: subs })
})

export const getSubmission = wrap(async (req, res) => {
  const sub = await Submission.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('problemId', 'title difficulty')
  if (!sub) throw new NotFoundError('Submission not found')
  res.json({ success: true, data: sub })
})

export default { createSubmission, listSubmissions, getSubmission }
