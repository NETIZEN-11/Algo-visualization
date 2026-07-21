import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaBolt, FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo, FaCopy, FaCheck, FaSearch } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import visualizeService from '../services/visualizeService'
import VisualizationEngine from '../components/visualization/VisualizationEngine'

/* ------------------------------------------------------------------ */
/* Adapters                                                            */
/* ------------------------------------------------------------------ */

/**
 * Convert the engine's step format (`{id, title, explanation, state, highlights}`)
 * into what `VisualizationEngine` already knows how to render
 * (`{step_number, state, explanation, highlights}`).
 */
function engineStepsToVisualization(steps, pattern, problemTitle) {
  return {
    type: pattern,
    title: problemTitle,
    steps: steps.map((s) => {
      const state = { ...(s.state || {}) }
      // Surface pointer hints in the legacy keys
      if (s.highlights?.indices?.length) state.highlight = s.highlights.indices
      if (s.highlights?.range) {
        const [l, r] = s.highlights.range
        state.window = [l, r]
        state.highlight = Array.from({ length: r - l + 1 }, (_, k) => l + k)
      }
      if (s.highlights?.ids?.length) state.cursor = s.highlights.ids[0]
      return {
        step_number: s.id,
        state,
        explanation: `${s.title}: ${s.explanation}`,
      }
    }),
  }
}

const PATTERN_CHOICES = [
  { key: 'array',           label: 'Array' },
  { key: 'two_pointer',     label: 'Two Pointer' },
  { key: 'sliding_window',  label: 'Sliding Window' },
  { key: 'binary_search',   label: 'Binary Search' },
  { key: 'stack',           label: 'Stack' },
  { key: 'queue',           label: 'Queue' },
  { key: 'linkedlist',      label: 'Linked List' },
  { key: 'tree',            label: 'Tree' },
  { key: 'bst',             label: 'BST' },
  { key: 'trie',            label: 'Trie' },
  { key: 'heap',            label: 'Heap' },
  { key: 'union_find',      label: 'Union-Find' },
  { key: 'graph',           label: 'Graph' },
  { key: 'dp',              label: 'DP' },
  { key: 'greedy',          label: 'Greedy' },
  { key: 'sorting',         label: 'Sorting' },
  { key: 'bit_manipulation',label: 'Bit' },
  { key: 'recursion',       label: 'Recursion' },
]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function DynamicVisualizationPage() {
  const [text, setText] = useState(SAMPLE_PROBLEM)
  const [problemId, setProblemId] = useState('')
  const [result, setResult] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(900)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Auto-play
  useEffect(() => {
    if (!isPlaying || !result?.steps?.length) return undefined
    const id = setTimeout(() => {
      setStepIndex((i) => {
        if (i >= result.steps.length - 1) {
          setIsPlaying(false)
          return i
        }
        return i + 1
      })
    }, speed)
    return () => clearTimeout(id)
  }, [isPlaying, stepIndex, speed, result])

  const visualization = useMemo(() => {
    if (!result?.steps?.length) return null
    return engineStepsToVisualization(
      result.steps,
      result.pattern,
      result.meta?.problemTitle || 'Visualization'
    )
  }, [result])

  /* ----------------------- handlers ----------------------- */

  const runText = useCallback(async () => {
    if (!text.trim()) return toast.error('Paste a problem first.')
    setLoading(true)
    setIsPlaying(false)
    try {
      const data = await visualizeService.fromText(text)
      setResult(data)
      setStepIndex(0)
      toast.success(
        `Detected: ${data.patternLabel} (confidence ${(data.confidence * 100).toFixed(0)}%)`
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate visualization')
    } finally {
      setLoading(false)
    }
  }, [text])

  const runById = useCallback(async () => {
    if (!problemId.trim()) return toast.error('Enter a problem id.')
    setLoading(true)
    setIsPlaying(false)
    try {
      const data = await visualizeService.fromProblem(problemId.trim())
      setResult(data)
      setStepIndex(0)
      toast.success(`Detected: ${data.patternLabel}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load problem')
    } finally {
      setLoading(false)
    }
  }, [problemId])

  const classifyOnly = useCallback(async () => {
    setLoading(true)
    try {
      const data = await visualizeService.classify({
        title: text.split('\n')[0]?.replace(/^\d+\.\s*/, '').trim(),
        description: text,
      })
      toast.success(`Pattern: ${data.patternLabel} (${(data.confidence * 100).toFixed(0)}% confident)`)
    } catch (err) {
      toast.error('Classification failed')
    } finally {
      setLoading(false)
    }
  }, [text])

  const copyShareLink = useCallback(() => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => toast.error('Copy failed'))
  }, [result])

  const reset = () => {
    setStepIndex(0)
    setIsPlaying(false)
  }

  /* ----------------------- render ----------------------- */

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaBolt className="text-yellow-400" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Dynamic Visualization Lab
          </span>
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Paste any LeetCode-style problem (or a problem id) and the engine will detect the
          algorithm pattern and generate a step-by-step animation. No LLM, fully offline,
          deterministic.
        </p>
        <div className="mt-3 text-sm">
          <Link to="/visualization" className="text-orange-400 hover:underline">
            ← Back to traditional viz
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-2">Paste a problem</h2>
            <p className="text-xs text-gray-500 mb-2">
              Title on the first line, an <code>Example</code> block is enough.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              className="w-full font-mono text-xs bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              placeholder={SAMPLE_PROBLEM}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={runText}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Working…' : 'Visualize'}
              </button>
              <button
                onClick={classifyOnly}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Classify only
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-2">Or load by problem id</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={problemId}
                  onChange={(e) => setProblemId(e.target.value)}
                  placeholder="e.g. two-sum or 507f1f85…"
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                onClick={runById}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Load
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {PATTERN_CHOICES.map((p) => (
                <span
                  key={p.key}
                  className="text-[10px] px-2 py-1 bg-gray-800 text-gray-300 rounded-full border border-gray-700"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: visualizer */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400">Pattern:</span>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold">
                  {result.patternLabel}
                </span>
                <span className="text-xs text-gray-500">
                  confidence {(result.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">
                  · {result.steps.length} steps
                </span>
                <span className="text-xs text-gray-500">
                  · source {result.meta?.source}
                </span>
                <button
                  onClick={copyShareLink}
                  className="ml-auto px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs flex items-center gap-1"
                >
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied' : 'Export JSON'}
                </button>
              </div>

              {result.warnings?.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
                  {result.warnings.map((w) => (
                    <div key={w}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    aria-label="Previous step"
                  >
                    <FaStepBackward />
                  </button>
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <button
                    onClick={() =>
                      setStepIndex((i) => Math.min(result.steps.length - 1, i + 1))
                    }
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    aria-label="Next step"
                  >
                    <FaStepForward />
                  </button>
                  <button
                    onClick={reset}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    aria-label="Reset"
                  >
                    <FaRedo />
                  </button>
                  <div className="flex items-center gap-2 ml-2 text-xs text-gray-400">
                    <span>Speed</span>
                    <input
                      type="range"
                      min={150}
                      max={2500}
                      step={50}
                      value={2700 - speed}
                      onChange={(e) => setSpeed(2700 - Number(e.target.value))}
                      className="accent-orange-500"
                    />
                  </div>
                  <div className="ml-auto text-xs text-gray-400">
                    Step {stepIndex + 1} / {result.steps.length}
                  </div>
                </div>
                <div className="mt-3 text-sm bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                  <div className="font-semibold text-orange-300">
                    {result.steps[stepIndex]?.title}
                  </div>
                  <div className="text-gray-300 mt-1">
                    {result.steps[stepIndex]?.explanation}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 min-h-[420px]">
                <VisualizationEngine
                  visualizationData={visualization}
                  type={result.pattern}
                  initialStep={stepIndex}
                  autoPlay={isPlaying}
                />
              </div>
            </>
          ) : (
            <div className="bg-gray-900 rounded-2xl p-10 border border-gray-800 text-center text-gray-400 min-h-[420px] flex flex-col items-center justify-center">
              <FaBolt className="text-4xl text-orange-400 mb-3" />
              <p className="text-lg font-semibold text-white">Ready to visualize</p>
              <p className="text-sm mt-1 max-w-sm">
                Paste a LeetCode-style problem on the left and click <b>Visualize</b>.
                The engine will detect the pattern and build an animation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SAMPLE_PROBLEM = `Two Sum

Given an array of integers nums and an integer target, return indices of the two
numbers such that they add up to target.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Constraints:
  - 2 <= nums.length <= 10^4
  - Only one valid answer exists.
`

export default DynamicVisualizationPage
