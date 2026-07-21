import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowLeft, FaBookmark, FaShare, FaCheck,
} from 'react-icons/fa'
import { ALGORITHMS, generateSteps } from '../data/algorithmCatalog'
import VisualizationEngine from '../components/visualization/VisualizationEngine'
import VariablesPanel from '../components/visualization/VariablesPanel'
import CodePanel from '../components/visualization/CodePanel'
import ComplexityBadge from '../components/visualization/ComplexityBadge'
import InputPanel from '../components/visualization/InputPanel'
import api from '../services/api'

function AlgorithmDetailPage() {
  const { slug } = useParams()
  const algo = ALGORITHMS[slug]
  const presetNames = useMemo(() => Object.keys(algo?.presets || {}), [algo])

  const activePreset = presetNames[0]
  const [currentInput, setCurrentInput] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoaded, setBookmarkLoaded] = useState(false)

  useEffect(() => {
    if (!algo) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/bookmarks/${algo.id}`)
        if (!cancelled) setIsBookmarked(!!res.data?.bookmarked)
      } catch {

      } finally {
        if (!cancelled) setBookmarkLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [algo])

  const steps = useMemo(() => {
    if (!algo) return []
    if (currentInput !== null) {
      return safeGenerate(algo.id, currentInput)
    }
    const preset = algo.presets[activePreset]
    if (!preset) return []
    return safeGenerate(algo.id, preset.input, preset.target, preset.k, preset.value)
  }, [algo, activePreset, currentInput])

  const handleRunInput = useCallback((parsed) => {
    setCurrentInput(parsed)
  }, [])

  const handleBookmark = async () => {
    if (!algo) return
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${algo.id}`)
        setIsBookmarked(false)
      } else {
        await api.post('/bookmarks', { algorithmId: algo.id })
        setIsBookmarked(true)
      }
    } catch {

    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)

    } catch {

    }
  }

  if (!algo) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8">
        <Link
          to="/visualization"
          className="text-orange-400 hover:underline flex items-center gap-2 mb-6"
        >
          <FaArrowLeft /> Back to all algorithms
        </Link>
        <h1 className="text-3xl font-bold">Algorithm not found</h1>
        <p className="text-gray-400 mt-2">No entry for "{slug}".</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">
        {}
        <div>
          <Link
            to="/visualization"
            className="text-orange-400 hover:underline text-sm flex items-center gap-2 mb-3"
          >
            <FaArrowLeft /> Back to all algorithms
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {algo.name}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${difficultyClass(
                    algo.difficulty
                  )}`}
                >
                  {algo.difficulty}
                </span>
              </h1>
              <p className="text-gray-400 mt-2 text-lg">{algo.description}</p>
              <div className="mt-3">
                <ComplexityBadge time={algo.timeComplexity} space={algo.spaceComplexity} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                disabled={!bookmarkLoaded}
                className={`p-2.5 rounded-lg border transition-colors ${
                  isBookmarked
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                {isBookmarked ? <FaCheck /> : <FaBookmark />}
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300"
                title="Copy link"
              >
                <FaShare />
              </button>
            </div>
          </div>
        </div>

        {}
        <InputPanel
          presets={algo.presets}
          defaultPreset={activePreset}
          customHint={customHintFor(algo.id)}
          targetKey={targetKeyFor(algo.id)}
          onRun={handleRunInput}
        />

        {}
        <AlgorithmView
          algo={algo}
          steps={steps}
          language={language}
          onLanguageChange={setLanguage}
        />
      </div>
    </div>
  )
}

function AlgorithmView({ algo, steps, language, onLanguageChange }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setStepIndex(0)
  }, [steps])

  const totalSteps = steps.length
  const safeIndex = Math.min(Math.max(0, stepIndex), Math.max(0, totalSteps - 1))
  const currentStep = steps[safeIndex] || {}
  const currentCodeLine = findCodeLineNumber(algo.code?.[language] || algo.code?.javascript || '', currentStep.codeLine)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {}
      <div className="lg:col-span-3 space-y-3">
        <motion.div
          key={algo.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-4 min-h-[420px]"
        >
          {totalSteps > 0 ? (
            <VisualizationEngine
              visualizationData={{ steps }}
              type={visualizationTypeFor(algo.id)}
              onStepChange={(idx) => setStepIndex(idx)}
            />
          ) : (
            <p className="text-gray-400">No steps for this input.</p>
          )}
        </motion.div>
        <VariablesPanel
          variables={currentStep.variables}
          explanation={currentStep.explanation}
          codeLine={currentStep.codeLine}
          complexity={currentStep.complexity}
        />
      </div>

      {}
      <div className="lg:col-span-2 space-y-3">
        <CodePanel
          code={algo.code}
          currentLine={currentCodeLine}
          language={language}
          onLanguageChange={onLanguageChange}
        />
        <div className="text-xs text-gray-500 text-right">
          Step {safeIndex + 1} of {totalSteps}
        </div>
      </div>
    </div>
  )
}

function findCodeLineNumber(source, snippet) {
  if (!source || !snippet) return null
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(snippet)) return i + 1
  }
  return null
}

function safeGenerate(id, input, target, k, value) {
  try {
    if (id === 'binary-search' || id === 'linear-search' || id === 'two-sum-sorted') {
      return generateSteps(id, { array: input, target: target ?? defaultTarget(id) })
    }
    if (id === 'sliding-window-max') {
      return generateSteps(id, { array: input, k: k ?? 3 })
    }
    if (id === 'bst-insert') {
      return generateSteps(id, { tree: input, value: value ?? defaultValue(id) })
    }
    if (id === 'valid-parentheses') {
      return generateSteps(id, input)
    }
    if (id === 'bfs-graph' || id === 'dijkstra') {
      return generateSteps(id, input)
    }
    if (id === 'coin-change') {
      return generateSteps(id, input)
    }
    if (id === 'fibonacci-dp') {
      return generateSteps(id, input)
    }
    return generateSteps(id, input)
  } catch (e) {
    console.warn('step generation failed:', e)
    return []
  }
}

function defaultTarget(id) {
  if (id === 'binary-search') return 7
  if (id === 'linear-search') return 7
  if (id === 'two-sum-sorted') return 9
  return 1
}
function defaultValue(id) {
  if (id === 'bst-insert') return 1
  return 1
}

function customHintFor(id) {
  if (id === 'binary-search' || id === 'linear-search') return 'arr=[...], target=N'
  if (id === 'two-sum-sorted') return 'arr=[...], target=N'
  if (id === 'sliding-window-max') return 'arr=[...], k=N'
  if (id === 'bst-insert') return 'tree=[...], value=N'
  if (id === 'valid-parentheses') return 's="([{}])"'
  if (id === 'fibonacci-dp') return 'n=N'
  if (id === 'coin-change') return 'amount=N, coins=[...]'
  if (id === 'bfs-graph') return 'source=A, graph={"A":["B","C"]}'
  if (id === 'dijkstra') return 'source=A, graph={"A":[["B",1]]}'
  return 'arr=[...]'
}

function targetKeyFor(id) {
  if (id === 'valid-parentheses') return 's'
  if (id === 'fibonacci-dp') return 'n'
  if (id === 'bfs-graph' || id === 'dijkstra') return 'arr'
  if (id === 'coin-change') return 'amount'
  return 'arr'
}

function visualizationTypeFor(id) {
  if (id === 'bfs-graph' || id === 'dijkstra') return 'graph'
  if (id === 'bst-insert') return 'tree'
  if (id === 'valid-parentheses') return 'stack'
  if (id === 'reverse-linked-list' || id === 'detect-cycle') return 'linkedlist'
  if (id === 'fibonacci-dp' || id === 'coin-change') return 'dp'
  if (id === 'sliding-window-max') return 'sliding_window'
  if (id === 'two-sum-sorted') return 'two_pointer'
  if (id === 'binary-search' || id === 'linear-search') return 'array'
  return 'array'
}

function difficultyClass(d) {
  if (d === 'Easy') return 'bg-green-500/15 text-green-300 border-green-500/30'
  if (d === 'Medium') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
  if (d === 'Hard') return 'bg-red-500/15 text-red-300 border-red-500/30'
  return 'bg-gray-700 text-gray-300 border-gray-600'
}

export default AlgorithmDetailPage
