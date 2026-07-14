/**
 * Submission controller — record and list.
 */
import { Submission, User, UserProgress } from '../models/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { addXP } from '../utils/leveling.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
export const createSubmission = wrap(async (req, res) => {
  const { problemId, code, language, status, runtime, memory, testCasesPassed, testCasesTotal } = req.body
  if (!problemId || !code || !language) throw new ValidationError('problemId, code, language are required')

  const isAccepted = status === 'accepted'
  const sub = await Submission.create({
    userId: req.user._id,
    problemId,
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
    const alreadySolved = (user.solvedProblems || []).some((id) => id.toString() === problemId)
    if (!alreadySolved) {
      user.solvedProblems.push(problemId)
      const lang = req.body.difficulty || 'medium'
      const key = String(lang).toLowerCase()
      if (['easy', 'medium', 'hard'].includes(key)) {
        user.problemStats[key] = (user.problemStats[key] || 0) + 1
      }
      user.problemStats.total = (user.problemStats.total || 0) + 1
      await user.save()
      await addXP(req.user._id, 20, 'Accepted submission')
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
