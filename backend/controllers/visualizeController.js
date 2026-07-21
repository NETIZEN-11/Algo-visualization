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
