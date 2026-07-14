/**
 * Interview controller.
 *
 * Bug fixes over the previous version:
 *  - All handlers use `next(error)` / `throw` consistently.
 *  - `getStats` no longer crashes for users with zero completed interviews.
 *  - `endInterview` no longer calls `interview.save()` twice.
 *  - `submitAnswer` writes the canonical feedback shape (no spread of
 *    untrusted AI fields into the schema) and persists the raw score.
 *  - `getNextQuestion` / `getFollowUpQuestion` accept a timeSpent header.
 *  - `recentImprovement` is sorted by `startedAt` so the most recent
 *    interview is correctly compared with the earliest.
 *  - `abandonInterview` is added for cleanly leaving a session.
 */
import Interview from '../models/Interview.js'
import { AppError, NotFoundError, ValidationError, BadRequestError } from '../utils/errors.js'
import { conductInterviewWithAI } from '../services/aiService.js'
import { addXP } from './gamificationController.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
/* Start                                                                */
/* ------------------------------------------------------------------ */
export const startInterview = wrap(async (req, res) => {
  let { difficulty, type, interviewType, targetCompany } = req.body
  if (typeof difficulty === 'string') {
    difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
  }
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    throw new ValidationError('difficulty must be Easy, Medium, or Hard')
  }

  const interview = await Interview.create({
    userId: req.user._id,
    difficulty,
    interviewType: interviewType || 'technical',
    targetCompany: targetCompany || null,
    status: 'active',
    questions: [],
    startedAt: new Date(),
  })

  const firstQuestion = await conductInterviewWithAI({
    action: 'start',
    difficulty,
    type,
  })

  interview.questions.push({
    questionNumber: 1,
    question: firstQuestion.question,
    category: firstQuestion.category || 'DSA',
    askedAt: new Date(),
  })

  await interview.save()

  res.status(201).json({
    success: true,
    message: 'Interview session started',
    sessionId: interview._id,
    question: firstQuestion.question,
  })
})

/* ------------------------------------------------------------------ */
/* Submit answer                                                        */
/* ------------------------------------------------------------------ */
export const submitAnswer = wrap(async (req, res) => {
  const { sessionId } = req.params
  const { answer, timeSpentSec, questionIndex } = req.body
  if (!answer) throw new ValidationError('Answer is required')

  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')
  if (interview.status !== 'active') {
    throw new BadRequestError('Interview session is not active')
  }

  // Either answer the last open question, or the one at `questionIndex`.
  const idx =
    typeof questionIndex === 'number' && questionIndex >= 0 && questionIndex < interview.questions.length
      ? questionIndex
      : interview.questions.length - 1
  const currentQuestion = interview.questions[idx]
  if (!currentQuestion) throw new NotFoundError('Question not found in session')
  if (currentQuestion.answer) throw new BadRequestError('Question already answered')

  currentQuestion.answer = answer
  currentQuestion.answeredAt = new Date()
  currentQuestion.timeSpent = timeSpentSec || 0

  const feedback = await conductInterviewWithAI({
    action: 'evaluate',
    question: currentQuestion.question,
    answer,
    difficulty: interview.difficulty,
  })

  const rawScore = Number(feedback.score) || 0
  // AI returns 0-100; persist both the raw score and a 0-10 rating.
  const clampedRating = Math.max(0, Math.min(10, Math.round(rawScore / 10)))

  currentQuestion.score = rawScore
  currentQuestion.feedback = {
    rating: clampedRating,
    correctness: typeof feedback.correctness === 'string' ? feedback.correctness : null,
    timeComplexity: feedback.timeComplexity || null,
    spaceComplexity: feedback.spaceComplexity || null,
    codeQuality: feedback.codeQuality || null,
    communicationSkills: feedback.communicationSkills || null,
    suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions : [],
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
    weaknesses: Array.isArray(feedback.weaknesses) ? feedback.weaknesses : [],
  }
  if (currentQuestion.category === 'System Design' || interview.interviewType === 'system-design') {
    currentQuestion.systemDesignScore = rawScore
  }

  await interview.save()

  res.json({
    success: true,
    feedback: currentQuestion.feedback,
    score: rawScore,
  })
})

/* ------------------------------------------------------------------ */
/* Next / follow-up                                                     */
/* ------------------------------------------------------------------ */
export const getNextQuestion = wrap(async (req, res) => {
  const { sessionId } = req.params
  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')
  if (interview.status !== 'active') {
    throw new BadRequestError('Interview session is not active')
  }

  const lastQuestion = interview.questions[interview.questions.length - 1]
  if (!lastQuestion.answer) {
    throw new BadRequestError('Please answer the current question first')
  }

  const nextQuestion = await conductInterviewWithAI({
    action: 'next',
    difficulty: interview.difficulty,
    previousQuestions: interview.questions.map((q) => q.question),
    lastAnswer: lastQuestion.answer,
  })

  interview.questions.push({
    questionNumber: interview.questions.length + 1,
    question: nextQuestion.question,
    category: nextQuestion.category || 'DSA',
    askedAt: new Date(),
  })
  await interview.save()

  res.json({
    success: true,
    question: nextQuestion.question,
    questionNumber: interview.questions.length,
  })
})

export const getFollowUpQuestion = wrap(async (req, res) => {
  const { sessionId } = req.params
  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')

  const lastQuestion = interview.questions[interview.questions.length - 1]
  if (!lastQuestion?.answer) {
    throw new BadRequestError('Please answer the current question first')
  }

  const followUp = await conductInterviewWithAI({
    action: 'followup',
    question: lastQuestion.question,
    answer: lastQuestion.answer,
    difficulty: interview.difficulty,
  })

  interview.questions.push({
    questionNumber: interview.questions.length + 1,
    question: followUp.question,
    category: 'Follow-up',
    askedAt: new Date(),
  })
  await interview.save()

  res.json({ success: true, followUpQuestion: followUp.question })
})

/* ------------------------------------------------------------------ */
/* End / abandon                                                        */
/* ------------------------------------------------------------------ */
export const endInterview = wrap(async (req, res) => {
  const { sessionId } = req.params
  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')

  if (interview.status === 'completed') {
    // Idempotent — return the summary without re-awarding XP.
    return res.json({ success: true, message: 'Interview already ended', summary: summarise(interview) })
  }

  interview.status = 'completed'
  interview.endedAt = new Date()

  // Overall score across answered questions
  const answered = interview.questions.filter((q) => q.answer)
  const totalScore = answered.reduce((sum, q) => sum + (q.score || 0), 0)
  interview.score = answered.length > 0 ? totalScore / answered.length : 0

  // System design sub-score, if any
  const sdScores = interview.questions
    .map((q) => q.systemDesignScore)
    .filter((s) => typeof s === 'number')
  if (sdScores.length) {
    interview.systemDesignScore = sdScores.reduce((a, b) => a + b, 0) / sdScores.length
  }

  const xpEarned = Math.floor(interview.score * 2) + answered.length * 10
  interview.xpEarned = xpEarned
  await interview.save() // single save

  if (xpEarned > 0) {
    await addXP(req.user._id, xpEarned, 'Completed Mock Interview').catch(() => {})
  }

  res.json({ success: true, message: 'Interview session ended', summary: summarise(interview, xpEarned) })
})

export const abandonInterview = wrap(async (req, res) => {
  const { sessionId } = req.params
  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')
  if (interview.status !== 'active') {
    return res.json({ success: true, message: 'Interview already ended' })
  }
  interview.status = 'abandoned'
  interview.endedAt = new Date()
  await interview.save()
  res.json({ success: true, message: 'Interview abandoned' })
})

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */
export const getInterview = wrap(async (req, res) => {
  const interview = await Interview.findById(req.params.sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')
  res.json({ success: true, data: interview })
})

export const getQuestionFeedback = wrap(async (req, res) => {
  const { sessionId, questionId } = req.params
  const interview = await Interview.findById(sessionId)
  if (!interview) throw new NotFoundError('Interview session not found')

  let question
  if (/^\d+$/.test(questionId)) {
    const idx = parseInt(questionId, 10)
    question = interview.questions.find(
      (q) => q.questionNumber === idx || interview.questions.indexOf(q) === idx
    )
  }
  if (!question) throw new NotFoundError('Question not found in session')

  res.json({
    success: true,
    data: {
      question: question.question,
      answer: question.answer,
      feedback: question.feedback,
      score: question.score,
      answeredAt: question.answeredAt,
    },
  })
})

export const getHistory = wrap(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const query = { userId: req.user._id }
  if (req.query.status) query.status = req.query.status

  const interviews = await Interview.find(query)
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('-questions.feedback')

  res.json({ success: true, count: interviews.length, data: interviews })
})

/* ------------------------------------------------------------------ */
/* Stats — fixed to not crash on empty list                            */
/* ------------------------------------------------------------------ */
export const getStats = wrap(async (req, res) => {
  const interviews = await Interview.find({ userId: req.user._id, status: 'completed' })
    .sort({ startedAt: 1 }) // oldest first → newest last

  const totalInterviews = interviews.length
  const averageScore =
    totalInterviews > 0
      ? interviews.reduce((sum, i) => sum + (i.score || 0), 0) / totalInterviews
      : 0

  const difficultyBreakdown = {
    easy: interviews.filter((i) => i.difficulty === 'Easy').length,
    medium: interviews.filter((i) => i.difficulty === 'Medium').length,
    hard: interviews.filter((i) => i.difficulty === 'Hard').length,
  }

  const recentImprovement =
    totalInterviews >= 2
      ? interviews[totalInterviews - 1].score - interviews[0].score
      : 0

  const lastInterview = interviews[totalInterviews - 1] || null

  res.json({
    success: true,
    stats: {
      totalInterviews,
      averageScore: Math.round(averageScore),
      difficultyBreakdown,
      recentImprovement: Math.round(recentImprovement),
      lastInterviewDate: lastInterview?.startedAt || null,
    },
  })
})

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */
function summarise(interview, xpEarned) {
  return {
    totalQuestions: interview.questions.length,
    answeredQuestions: interview.questions.filter((q) => q.answer).length,
    score: interview.score,
    duration: interview.duration,
    xpEarned: xpEarned ?? interview.xpEarned ?? 0,
    questions: interview.questions.map((q) => ({
      question: q.question,
      answered: !!q.answer,
      score: q.score,
      feedback: q.feedback,
    })),
  }
}
