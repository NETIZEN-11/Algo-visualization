/**
 * AI controller — wraps the aiService and enforces per-user rate limit.
 *
 * All handlers use `next(error)` / `throw`. Each handler reads
 * `req.user._id` so the AI service can record token usage.
 */
import {
  generateHintsWithAI,
  analyzeCodeWithAI,
  generateTestCasesWithAI,
  generateDryRunWithAI,
  generateFlashcardsWithAI,
  generateVisualizationWithAI,
  aiServiceInfo,
} from '../services/aiService.js'
import { aiRateLimiter } from '../middleware/rateLimiter.js'
import { ValidationError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
/* Hint                                                                  */
/* ------------------------------------------------------------------ */
export const getHints = wrap(async (req, res) => {
  const { problemData, hintLevel = 1 } = req.body
  if (!problemData) throw new ValidationError('problemData is required')
  const lv = Math.min(3, Math.max(1, parseInt(hintLevel, 10) || 1))
  const result = await generateHintsWithAI(problemData, lv, { userId: req.user?._id })
  res.json({ success: true, data: result })
})

/* ------------------------------------------------------------------ */
/* Bug / code review                                                     */
/* ------------------------------------------------------------------ */
export const detectBugs = wrap(async (req, res) => {
  const { code, language, problemContext } = req.body
  if (!code || !language) throw new ValidationError('code and language are required')
  const analysis = await analyzeCodeWithAI(code, language, problemContext || '', { userId: req.user?._id })
  res.json({ success: true, data: analysis })
})

/* ------------------------------------------------------------------ */
/* Test cases                                                            */
/* ------------------------------------------------------------------ */
export const generateTestCases = wrap(async (req, res) => {
  const { problemData } = req.body
  if (!problemData) throw new ValidationError('problemData is required')
  const cases = await generateTestCasesWithAI(problemData, { userId: req.user?._id })
  res.json({ success: true, data: cases })
})

/* ------------------------------------------------------------------ */
/* Dry run                                                               */
/* ------------------------------------------------------------------ */
export const generateDryRun = wrap(async (req, res) => {
  const { problemData, code, customInput, language = 'python' } = req.body
  if (!problemData || !code || !customInput || !language) {
    throw new ValidationError('problemData, code, customInput, language are required')
  }
  const dryRun = await generateDryRunWithAI(problemData, code, customInput, language, { userId: req.user?._id })
  res.json({ success: true, data: dryRun })
})

/* ------------------------------------------------------------------ */
/* Concept explainer                                                     */
/* ------------------------------------------------------------------ */
export const explainConcept = wrap(async (req, res) => {
  const { conceptName, context } = req.body
  if (!conceptName) throw new ValidationError('conceptName is required')
  // Reuse the hints pipeline to explain a concept in plain English.
  const result = await generateHintsWithAI(
    { title: `Explain: ${conceptName}`, description: context || conceptName },
    1,
    { userId: req.user?._id }
  )
  res.json({ success: true, data: { concept: conceptName, explanation: result.hint } })
})

/* ------------------------------------------------------------------ */
/* Chat — minimal session-less implementation (Phase 5 will add memory)  */
/* ------------------------------------------------------------------ */
export const chatWithTutor = wrap(async (req, res) => {
  const { question, conversationHistory = [] } = req.body
  if (!question) throw new ValidationError('question is required')
  // Build a transient problem-data and ask for a hint-shaped response.
  const result = await generateHintsWithAI(
    { title: 'DSA Tutor Chat', description: question + (conversationHistory.length ? `\n\nConversation so far:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}` : '') },
    2,
    { userId: req.user?._id }
  )
  res.json({ success: true, data: { reply: result.hint, mocked: result.mocked } })
})

/* ------------------------------------------------------------------ */
/* Compare approaches                                                    */
/* ------------------------------------------------------------------ */
export const compareApproaches = wrap(async (req, res) => {
  const { problemData } = req.body
  if (!problemData) throw new ValidationError('problemData is required')
  // Reuse the hint pipeline to get a "strategy" hint that explains
  // the two approaches. (A dedicated prompt can be added in Phase 5.)
  const result = await generateHintsWithAI(problemData, 2, { userId: req.user?._id })
  res.json({ success: true, data: { comparison: result.hint, mocked: result.mocked } })
})

/* ------------------------------------------------------------------ */
/* Flashcards                                                            */
/* ------------------------------------------------------------------ */
export const generateFlashcards = wrap(async (req, res) => {
  const { problemData, analysis } = req.body
  if (!problemData) throw new ValidationError('problemData is required')
  const cards = await generateFlashcardsWithAI(problemData, analysis, { userId: req.user?._id })
  res.json({ success: true, data: cards })
})

/* ------------------------------------------------------------------ */
/* Visualisation                                                         */
/* ------------------------------------------------------------------ */
export const generateVisualization = wrap(async (req, res) => {
  const { problemData } = req.body
  if (!problemData) throw new ValidationError('problemData is required')
  const viz = await generateVisualizationWithAI(problemData, { userId: req.user?._id })
  res.json({ success: true, data: viz })
})

/* ------------------------------------------------------------------ */
/* Health / info                                                         */
/* ------------------------------------------------------------------ */
export const getStatus = wrap(async (_req, res) => {
  res.json({ success: true, data: aiServiceInfo() })
})

/* Per-user rate-limit guard — exported for the route layer. */
export { aiRateLimiter }

export default {
  getHints,
  detectBugs,
  generateTestCases,
  generateDryRun,
  explainConcept,
  chatWithTutor,
  compareApproaches,
  generateFlashcards,
  generateVisualization,
  getStatus,
}
