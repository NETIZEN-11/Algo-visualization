/**
 * AI service — single client, one helper, retry with backoff, token
 * accounting, and parameterised mock fallbacks.
 *
 * Set `MOCK_AI=true` (dev) to skip OpenAI entirely; the mock layer
 * produces *problem-specific* responses (see `aiMockGenerators.js`).
 *
 * The server refuses to boot in production with `MOCK_AI=true` or a
 * placeholder `OPENAI_API_KEY`.
 */
import OpenAI from 'openai'
import AiUsage from '../models/AiUsage.js'
import { logger } from '../utils/logger.js'
import { detectPattern } from '../engine/patternDetector.js'
import { patternLabel } from '../engine/stepGenerator.js'
import {
  mockAnalysis,
  mockHint,
  mockCodeReview,
  mockTestCases,
  mockDryRun,
  mockInterviewFeedback,
  mockInterviewQuestion,
  mockReadiness,
  mockFlashcards,
  mockVisualisation,
} from '../utils/aiMockGenerators.js'

/* ------------------------------------------------------------------ */
/* Configuration                                                        */
/* ------------------------------------------------------------------ */
export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 2048
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE) || 0.4
const DAILY_AI_TOKEN_LIMIT = Number(process.env.DAILY_AI_TOKEN_LIMIT) || 200_000

const useMockAi = process.env.MOCK_AI === 'true' || process.env.MOCK_AI === '1'
const hasRealKey =
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
  process.env.OPENAI_API_KEY.length > 20

let openai = null
if (!useMockAi && hasRealKey) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  logger.info({ model: AI_MODEL }, 'OpenAI client initialised')
} else if (useMockAi) {
  logger.info('MOCK_AI=true — AI features will return mock data')
} else {
  logger.warn('OpenAI API key not configured — AI features will return mock data')
}

export const isMocked = () => useMockAi || !openai

/* ------------------------------------------------------------------ */
/* Token accounting (per-user, per-day)                                */
/* ------------------------------------------------------------------ */
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)

const usageCache = new Map() // userId -> { day, total }

const getUsageToday = async (userId) => {
  if (!userId) return 0
  const key = String(userId)
  const cached = usageCache.get(key)
  const today = dayKey()
  if (cached && cached.day === today) return cached.total
  // Sum usage from DB to be authoritative (across replicas).
  // Use a string-keyed object so editors don't mis-tokenise the
  // MongoDB $-prefixed operators (which are valid as unquoted keys
  // but trip up some highlighters and TS-language-services).
  const start = new Date(today + 'T00:00:00Z')
  const matchStage = { $match: { userId: userId, createdAt: { $gte: start } } }
  const groupStage = { $group: { _id: null, total: { $sum: '$totalTokens' } } }
  const agg = await AiUsage.aggregate([matchStage, groupStage]).catch(() => [])
  const total = (agg && agg[0] && agg[0].total) || 0
  usageCache.set(key, { day: today, total })
  return total
}

const recordUsage = async ({ userId, feature, promptTokens, completionTokens, durationMs, error, mocked }) => {
  if (!userId) return
  const total = (promptTokens || 0) + (completionTokens || 0)
  try {
    await AiUsage.create({
      userId,
      feature,
      model: AI_MODEL,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      totalTokens: total,
      mocked: !!mocked,
      durationMs: durationMs || 0,
      error: error || null,
    })
    // Update cache
    const key = String(userId)
    const cached = usageCache.get(key) || { day: dayKey(), total: 0 }
    if (cached.day === dayKey()) cached.total += total
    else cached.total = total
    cached.day = dayKey()
    usageCache.set(key, cached)
  } catch (err) {
    logger.error({ err: err.message }, 'recordUsage failed')
  }
}

/* ------------------------------------------------------------------ */
/* Retry with exponential backoff                                      */
/* ------------------------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const withRetry = async (fn, { attempts = 3, baseMs = 500 } = {}) => {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const retriable =
        err?.status === 429 ||
        err?.status >= 500 ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEDOUT'
      if (!retriable || i === attempts - 1) break
      const wait = baseMs * Math.pow(2, i) + Math.random() * baseMs
      logger.warn({ attempt: i + 1, wait, err: err.message }, 'AI call retrying')
      await sleep(wait)
    }
  }
  throw lastErr
}

/* ------------------------------------------------------------------ */
/* Core call helper                                                     */
/* ------------------------------------------------------------------ */
const callOpenAI = async ({
  system,
  user,
  json = true,
  maxTokens = AI_MAX_TOKENS,
  temperature = AI_TEMPERATURE,
}) => {
  if (!openai) throw new Error('OpenAI not configured')
  return withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature,
      max_tokens: maxTokens,
      response_format: json ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const text = completion.choices?.[0]?.message?.content || '{}'
    const usage = completion.usage || {}
    let parsed
    try {
      parsed = json ? JSON.parse(text) : { text }
    } catch {
      parsed = json ? { _raw: text } : { text }
    }
    return {
      data: parsed,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    }
  })
}

/* ------------------------------------------------------------------ */
/* Token-budget guard                                                   */
/* ------------------------------------------------------------------ */
const ensureBudget = async (userId) => {
  if (!userId) return
  const used = await getUsageToday(userId)
  if (used >= DAILY_AI_TOKEN_LIMIT) {
    const err = new Error('Daily AI token limit reached. Try again tomorrow.')
    err.statusCode = 429
    err.code = 'AI_TOKEN_LIMIT'
    throw err
  }
}

/* ------------------------------------------------------------------ */
/* Public API — one function per feature                                */
/* ------------------------------------------------------------------ */
const start = Date.now()

/** Build a consistent problem context string with the detected pattern. */
const buildProblemContext = (problemData) => {
  const { title = '', description = '', examples = [], constraints = [], tags = [] } = problemData || {}
  const det = detectPattern({ title, description, tags })
  const label = patternLabel(det.pattern)
  return {
    det,
    label,
    block: `Problem: ${title}\n\nDescription:\n${description}\n\nExamples: ${JSON.stringify(examples || [])}\nConstraints: ${JSON.stringify(constraints || [])}\nTags: ${JSON.stringify(tags || [])}\nDetected pattern: ${label} (confidence ${(det.confidence * 100).toFixed(0)}%)`,
  }
}

export const analyzeProblemWithAI = async (problemData, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const data = mockAnalysis(problemData)
    recordUsage({ userId, feature: 'problemAnalysis', durationMs: Date.now() - t0, mocked: true })
    return data
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  const system = `You are an expert DSA tutor. The problem was pre-classified as "${label}". Return strict JSON only — no prose around it. The JSON must include fields: problem_summary, pattern_identification (data_structure, pattern, why_this_pattern), bruteforce_approach (idea, steps, time_complexity, space_complexity), optimal_approach (core_intuition, why_it_works, optimization_logic, edge_cases), code_solutions (python, javascript, java, cpp — all four required), complexity_analysis (time_complexity, space_complexity, reason), interview_insights (common_mistakes, edge_cases, follow_up_questions), revision_notes (pattern, key_idea, tc, sc).`
  try {
    const { data, usage } = await callOpenAI({ system, user: block, json: true, maxTokens: 3000 })
    await recordUsage({ userId, feature: 'problemAnalysis', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'problemAnalysis', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const generateHintsWithAI = async (problemData, level = 1, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockHint(problemData, level)
    recordUsage({ userId, feature: 'hint', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  const levelGuide = {
    1: 'nudge: ask the user a question that helps them think about the right approach, do not reveal the pattern',
    2: 'strategy: name the pattern and the data structure to use, but do not give the algorithm',
    3: 'near-solution: describe the algorithm in plain English, with the recurrence / loop, but do not write code',
  }
  const system = `You are a friendly DSA tutor. Hint level: ${levelGuide[level] || levelGuide[1]}. Be specific to the "${label}" pattern. Return JSON: { "hint": "..." }`
  const user = `${block}\n\nHint level: ${level} of 3.`
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 300 })
    await recordUsage({ userId, feature: 'hint', ...usage, durationMs: Date.now() - t0 })
    return { hint: data.hint || '', level }
  } catch (err) {
    await recordUsage({ userId, feature: 'hint', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const analyzeCodeWithAI = async (code, language, problemContext = '', { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockCodeReview(code, language)
    recordUsage({ userId, feature: 'codeReview', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  // Try to detect the pattern from the surrounding context for better advice
  let ctxPattern = ''
  if (problemContext) {
    try {
      const p = typeof problemContext === 'string' ? JSON.parse(problemContext) : problemContext
      const det = detectPattern(p || {})
      ctxPattern = ` (The problem is detected as "${patternLabel(det.pattern)}")`
    } catch { /* not JSON, ignore */ }
  }
  const system = `You are a senior code reviewer${ctxPattern}. Return strict JSON: { analysis, hasErrors, suggestions[] } — suggestions should be specific, not generic.`
  const user = `Language: ${language}\nContext: ${problemContext || '(none)'}\nCode:\n\`\`\`\n${code}\n\`\`\``
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 800 })
    await recordUsage({ userId, feature: 'codeReview', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'codeReview', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const generateTestCasesWithAI = async (problemData, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockTestCases(problemData)
    recordUsage({ userId, feature: 'testCase', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  const system = `You are a test designer. The problem is "${label}". Generate 5 test cases that probe the corners of THIS pattern: empty input, single element, boundary values, and a worst case for the "${label}" approach. Return strict JSON: { cases: [{ input, expected, explanation }] }`
  try {
    const { data, usage } = await callOpenAI({ system, user: block, maxTokens: 1200 })
    await recordUsage({ userId, feature: 'testCase', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'testCase', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const generateDryRunWithAI = async (problemData, code, customInput, language = 'python', { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockDryRun(code, customInput)
    recordUsage({ userId, feature: 'dryRun', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  const system = `You trace algorithms step-by-step. The problem is "${label}". Return strict JSON: { steps: [{step, description, state: {variables, highlights}}], finalOutput } — include real variable values, not "process element".`
  const user = `${block}\nLanguage: ${language}\nInput: ${customInput}\nCode:\n\`\`\`\n${code}\n\`\`\``
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 1500 })
    await recordUsage({ userId, feature: 'dryRun', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'dryRun', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const conductInterviewWithAI = async (params, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockInterviewQuestion(params?.difficulty, params?.action, params?.lastAnswer)
    recordUsage({ userId, feature: 'interviewFeedback', durationMs: Date.now() - t0, mocked: true })
    if (params?.action === 'evaluate') return mockInterviewFeedback(params.question, params.answer)
    return r
  }
  await ensureBudget(userId)

  if (params?.action === 'evaluate') {
    const det = detectPattern({ title: params.question, description: params.question })
    const label = patternLabel(det.pattern)
    const system = `You are a fair technical interviewer. The question is a "${label}" problem. Return strict JSON: { score (0-100), correctness, timeComplexity, spaceComplexity, codeQuality, communicationSkills, suggestions[], strengths[], weaknesses[] } — be specific to the "${label}" pattern.`
    const user = `Question: ${params.question}\nAnswer: ${params.answer}\nDifficulty: ${params.difficulty}`
    try {
      const { data, usage } = await callOpenAI({ system, user, maxTokens: 1200 })
      await recordUsage({ userId, feature: 'interviewFeedback', ...usage, durationMs: Date.now() - t0 })
      return data
    } catch (err) {
      await recordUsage({ userId, feature: 'interviewFeedback', durationMs: Date.now() - t0, error: err.message, mocked: true })
      throw err
    }
  }

  // Question generation — pick a difficulty-appropriate category
  const system = `You are a technical interviewer at a top-tier company. Generate ONE DSA question appropriate for the requested difficulty and the candidate's pattern history. Return strict JSON: { question, category, difficulty, pattern }`
  const user = JSON.stringify(params)
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 600 })
    await recordUsage({ userId, feature: 'interviewFeedback', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'interviewFeedback', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const calculateInterviewReadinessWithAI = async (userStats, solvedProblems, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockReadiness(userStats, solvedProblems)
    recordUsage({ userId, feature: 'readiness', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const system = 'You are a career coach. Return strict JSON: { overall_score, data_structures_score, algorithms_score, problem_solving_score, recommendations[] }'
  const user = `User stats: ${JSON.stringify(userStats)}\nSolved count: ${solvedProblems?.length || 0}`
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 800 })
    await recordUsage({ userId, feature: 'readiness', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'readiness', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const generateFlashcardsWithAI = async (problemData, analysis, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockFlashcards(problemData, analysis)
    recordUsage({ userId, feature: 'flashcards', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  const system = `You generate spaced-repetition flashcards. The problem is "${label}". Return strict JSON: { flashcards: [{ front, back, category }] } — at least 5 cards covering pattern, complexity, data structure, edge case, and one mistake to avoid.`
  const user = `${block}\nAnalysis: ${JSON.stringify(analysis)}`
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 1200 })
    await recordUsage({ userId, feature: 'flashcards', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'flashcards', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

export const generateVisualizationWithAI = async (problemData, { userId } = {}) => {
  const t0 = Date.now()
  if (isMocked()) {
    const r = mockVisualisation(problemData)
    recordUsage({ userId, feature: 'visualization', durationMs: Date.now() - t0, mocked: true })
    return r
  }
  await ensureBudget(userId)
  const { block, label } = buildProblemContext(problemData)
  // Even with a real LLM we still ship the deterministic engine's
  // output as a fallback — the LLM is asked only to enrich it.
  const system = `You build algorithm visualisations for "${label}" problems. Return strict JSON matching the VisualizationEngine schema: { type, steps: [{step_number, state, highlight, explanation}] }`
  const user = block
  try {
    const { data, usage } = await callOpenAI({ system, user, maxTokens: 1500 })
    await recordUsage({ userId, feature: 'visualization', ...usage, durationMs: Date.now() - t0 })
    return data
  } catch (err) {
    await recordUsage({ userId, feature: 'visualization', durationMs: Date.now() - t0, error: err.message, mocked: true })
    throw err
  }
}

/* Legacy aliases — keep old call sites compiling. */
export const generateInterviewFeedbackWithAI = conductInterviewWithAI

export const aiServiceInfo = () => ({
  mocked: isMocked(),
  model: AI_MODEL,
  dailyTokenLimit: DAILY_AI_TOKEN_LIMIT,
  uptimeMs: Date.now() - start,
})
