/**
 * Contest controller — list, join, submit, leaderboard.
 */
import { Contest, Submission, Problem } from '../models/index.js'
import { NotFoundError, ConflictError, BadRequestError, ValidationError, ForbiddenError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
export const listContests = wrap(async (req, res) => {
  const now = new Date()
  const filter = { isPublic: true }
  if (req.query.status === 'upcoming') filter.startTime = { $gt: now }
  if (req.query.status === 'ongoing') filter.startTime = { $lte: now }, (filter.endTime = { $gte: now })
  if (req.query.status === 'completed') filter.endTime = { $lt: now }
  const contests = await Contest.find(filter).sort({ startTime: -1 }).limit(50)
  res.json({ success: true, count: contests.length, data: contests })
})

export const getContest = wrap(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
  if (!contest) throw new NotFoundError('Contest not found')
  res.json({ success: true, data: contest })
})

/* ------------------------------------------------------------------ */
export const registerForContest = wrap(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
  if (!contest) throw new NotFoundError('Contest not found')
  const now = new Date()
  if (now > contest.endTime) throw new BadRequestError('Contest is over')

  const already = contest.participants.find(
    (p) => p.userId.toString() === req.user._id.toString()
  )
  if (already) throw new ConflictError('Already registered for this contest')

  contest.participants.push({ userId: req.user._id, score: 0, problemsSolved: 0 })
  await contest.save()
  res.json({ success: true, message: 'Registered', data: contest })
})

/* ------------------------------------------------------------------ */
export const submitToContest = wrap(async (req, res) => {
  const { problemId, code, language } = req.body
  if (!problemId || !code || !language) throw new ValidationError('problemId, code, language are required')

  const contest = await Contest.findById(req.params.id)
  if (!contest) throw new NotFoundError('Contest not found')

  const now = new Date()
  if (now < contest.startTime) throw new BadRequestError('Contest has not started yet')
  if (now > contest.endTime) throw new BadRequestError('Contest is over')

  const isParticipant = contest.participants.some(
    (p) => p.userId.toString() === req.user._id.toString()
  )
  if (!isParticipant) throw new ForbiddenError('Register for the contest first')

  const problemEntry = contest.problems.find((p) => p.problemId.toString() === problemId)
  if (!problemEntry) throw new BadRequestError('Problem is not part of this contest')

  // Record submission
  const submission = await Submission.create({
    userId: req.user._id,
    problemId,
    language,
    code,
    status: 'accepted', // Phase 5 doesn't run a real grader; treat as accepted
    isAccepted: true,
  })

  // Award points if first solve
  const part = contest.participants.find((p) => p.userId.toString() === req.user._id.toString())
  const alreadySolved = part.submissions.some(
    (s) => s.problemId.toString() === problemId && s.status === 'accepted'
  )
  if (!alreadySolved) {
    part.problemsSolved += 1
    part.score += problemEntry.points || 100
    part.submissions.push({
      problemId,
      submittedAt: new Date(),
      status: 'accepted',
      points: problemEntry.points || 100,
    })
  }
  await contest.save()

  res.json({ success: true, message: 'Submitted', data: { submission, score: part.score } })
})

/* ------------------------------------------------------------------ */
export const getContestLeaderboard = wrap(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
  if (!contest) throw new NotFoundError('Contest not found')
  const ranked = [...contest.participants]
    .sort((a, b) => b.score - a.score || a.problemsSolved - b.problemsSolved)
    .map((p, i) => ({ rank: i + 1, userId: p.userId, score: p.score, problemsSolved: p.problemsSolved }))
  res.json({ success: true, data: { contestId: contest._id, rankings: ranked } })
})

export default { listContests, getContest, registerForContest, submitToContest, getContestLeaderboard }
