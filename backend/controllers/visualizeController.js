/**
 * Visualisation engine controller.
 *
 * Three responsibilities:
 *   1. POST /api/visualize/from-text — paste problem text, return a
 *      `Step[]` (problem spec parsed locally, no LLM).
 *   2. POST /api/visualize/from-problem — pull an existing problem
 *      (by ObjectId or slug) and build steps for it.
 *   3. POST /api/visualize/pattern — just classify the problem; no
 *      animation. Cheap, used by the AI mock generators.
 *
 * No LLM, no network, no state. Same input always produces the same
 * output.
 */

import { parseProblemText } from '../engine/problemParser.js'
import { detectPattern, SUPPORTED_PATTERNS } from '../engine/patternDetector.js'
import { buildSteps, patternLabel } from '../engine/stepGenerator.js'
import Problem from '../models/Problem.js'

const wrap = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    console.error('[visualize]', err)
    res.status(500).json({ success: false, message: err.message || 'Visualization failed' })
  }
}

/* ------------------------------------------------------------------ */
/* POST /visualize/from-text                                            */
/* ------------------------------------------------------------------ */
export const fromText = wrap(async (req, res) => {
  const text = req.body?.text
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Provide `text` in the request body.' })
  }
  if (text.length > 50_000) {
    return res.status(413).json({ success: false, message: 'Problem text is too long (>50k chars).' })
  }

  const { spec, leetcodeSlug, warnings } = parseProblemText(text)
  const result = buildSteps(spec)
  res.json({
    success: true,
    data: {
      spec,
      leetcodeSlug,
      warnings,
      ...result,
    },
  })
})

/* ------------------------------------------------------------------ */
/* POST /visualize/from-problem                                         */
/* ------------------------------------------------------------------ */
export const fromProblem = wrap(async (req, res) => {
  const { id } = req.params
  const problem = await Problem.findOne({
    $or: [{ _id: id }, { slug: id }, { publicId: id }],
  }).lean()
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' })

  const spec = {
    title: problem.title,
    description: problem.description,
    tags: problem.tags || [],
    examples: (problem.examples || []).map((e) => ({
      input: e.input,
      output: e.output,
      explanation: e.explanation,
    })),
    source: 'curated',
  }
  const result = buildSteps(spec)
  res.json({ success: true, data: { spec, ...result } })
})

/* ------------------------------------------------------------------ */
/* POST /visualize/pattern                                              */
/* ------------------------------------------------------------------ */
export const classify = wrap(async (req, res) => {
  const spec = req.body?.spec || {}
  const detection = detectPattern(spec)
  res.json({
    success: true,
    data: {
      ...detection,
      patternLabel: patternLabel(detection.pattern),
      supportedPatterns: SUPPORTED_PATTERNS,
    },
  })
})
