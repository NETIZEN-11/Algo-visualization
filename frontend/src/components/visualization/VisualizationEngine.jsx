import { useState, useEffect, useCallback, useMemo } from 'react'
import ArrayVisualizer from './ArrayVisualizer'
import TreeVisualizer from './TreeVisualizer'
import GraphVisualizer from './GraphVisualizer'
import DPTableVisualizer from './DPTableVisualizer'
import LinkedListVisualizer from './LinkedListVisualizer'
import StackQueueVisualizer from './StackQueueVisualizer'
import VisualizationControls from './VisualizationControls'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye } from 'react-icons/fa'

// Normalize the type string coming from the AI — it can be anything like
// "sliding_window", "Sliding Window", "two_pointer", "Two Pointer", etc.
function normalizeType(raw) {
  if (!raw) return 'array'
  const t = raw.toLowerCase().replace(/[\s/-]/g, '_')
  if (t.includes('sliding') || t.includes('window')) return 'sliding_window'
  if (t.includes('two') && t.includes('pointer')) return 'two_pointer'
  if (t.includes('linked') || t.includes('list')) return 'linkedlist'
  if (t.includes('binary_search_tree') || t === 'bst') return 'tree' // reuse tree viz
  if (t.includes('heap') || t.includes('priority')) return 'array'    // heap shown as array
  if (t.includes('trie')) return 'tree'                              // trie shares tree viz
  if (t.includes('union')) return 'graph'                            // union-find via graph
  if (t.includes('bfs') || t.includes('dfs')) return 'graph'
  if (t.includes('graph')) return 'graph'
  if (t.includes('dynamic') || t === 'dp') return 'dp'
  if (t.includes('tree')) return 'tree'
  if (t.includes('stack')) return 'stack'
  if (t.includes('queue')) return 'queue'
  if (t.includes('sort')) return 'array'
  if (t.includes('greedy') || t.includes('interval')) return 'array'
  if (t.includes('bit')) return 'array'
  if (t.includes('recursion') || t.includes('back')) return 'array'
  if (t.includes('binary')) return 'array'                          // binary search as array
  if (t.includes('array') || t.includes('string')) return 'array'
  return 'array' // safe fallback
}

function VisualizationEngine({ visualizationData, type, onStepChange, initialStep = 0, autoPlay = false }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(
    Math.min(Math.max(0, initialStep), (visualizationData?.steps?.length || 1) - 1)
  )
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)

  const normalizedType = normalizeType(type)
  const steps = useMemo(() => visualizationData?.steps || [], [visualizationData])
  const totalSteps = steps.length

  // Reset when new visualization data arrives
  useEffect(() => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }, [visualizationData])

  // Lift the current step up so siblings (e.g. the code panel) can
  // sync their highlight to the active line. We do this in an effect
  // rather than in the step transitions to keep the call site cheap.
  useEffect(() => {
    onStepChange?.(currentStepIndex, steps[currentStepIndex])
  }, [currentStepIndex, steps, onStepChange])

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || currentStepIndex >= totalSteps - 1) {
      if (currentStepIndex >= totalSteps - 1) setIsPlaying(false)
      return
    }
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / speed)
    return () => clearInterval(interval)
  }, [isPlaying, currentStepIndex, totalSteps, speed])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          setIsPlaying(prev => !prev)
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentStepIndex(prev => Math.max(prev - 1, 0))
          break
        case 'r':
        case 'R':
          e.preventDefault()
          setIsPlaying(false)
          setCurrentStepIndex(0)
          break
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [totalSteps])

  const handlePlay = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) setCurrentStepIndex(0)
    setIsPlaying(true)
  }, [currentStepIndex, totalSteps])

  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleNext = useCallback(() => {
    setIsPlaying(false)
    setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])
  const handlePrevious = useCallback(() => {
    setIsPlaying(false)
    setCurrentStepIndex(prev => Math.max(prev - 1, 0))
  }, [])
  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setCurrentStepIndex(0)
  }, [])
  const handleSpeedChange = useCallback((s) => setSpeed(s), [])

  // No steps — show a descriptive empty state, not a spinner
  if (!visualizationData || totalSteps === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
        <div className="text-center text-gray-400 px-6">
          <FaEye className="text-5xl mx-auto mb-4 text-purple-500/40" />
          <p className="font-semibold mb-1">No visualization steps available</p>
          <p className="text-sm text-gray-500">
            Configure your OpenAI API key to get live step-by-step visualizations,
            or use the mock mode to see the analysis.
          </p>
        </div>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex] || {}

  // Pick the right visualizer component based on normalized type
  const renderVisualizer = () => {
    const commonProps = {
      currentStep,
      highlights: currentStep?.highlight || currentStep?.highlights || {},
    }

    switch (normalizedType) {
      case 'array':
      case 'sliding_window':
      case 'two_pointer': {
        // AI can store array in state.array OR state.nums OR state directly as array
        const arr =
          currentStep?.state?.array ??
          currentStep?.state?.nums ??
          (Array.isArray(currentStep?.state) ? currentStep.state : null)
        return <ArrayVisualizer data={arr} {...commonProps} />
      }

      case 'tree': {
        const tree = currentStep?.state?.tree ?? currentStep?.state?.root ?? currentStep?.state
        return <TreeVisualizer treeData={tree} {...commonProps} />
      }

      case 'graph':
        return (
          <GraphVisualizer
            graphData={{
              nodes: currentStep?.state?.nodes ?? [],
              edges: currentStep?.state?.edges ?? [],
              directed: currentStep?.state?.directed ?? false,
            }}
            {...commonProps}
          />
        )

      case 'dp': {
        const table = currentStep?.state?.table ?? currentStep?.state?.dp ?? currentStep?.state
        return <DPTableVisualizer tableData={table} {...commonProps} />
      }

      case 'linkedlist': {
        const nodes =
          currentStep?.state?.nodes ??
          currentStep?.state?.list ??
          currentStep?.state?.array
        return <LinkedListVisualizer data={nodes} {...commonProps} />
      }

      case 'stack': {
        const items = currentStep?.state?.stack ?? currentStep?.state?.items ?? currentStep?.state?.array
        return <StackQueueVisualizer data={items} type="stack" {...commonProps} />
      }

      case 'queue': {
        const items = currentStep?.state?.queue ?? currentStep?.state?.items ?? currentStep?.state?.array
        return <StackQueueVisualizer data={items} type="queue" {...commonProps} />
      }

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Visualization type <code className="mx-1 bg-gray-800 px-2 py-0.5 rounded">{type}</code> not supported yet
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Visualization area */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {renderVisualizer()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <VisualizationControls
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onReset={handleReset}
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        speed={speed}
        onSpeedChange={handleSpeedChange}
      />

      {/* Step explanation */}
      {currentStep?.explanation && (
        <motion.div
          key={`exp-${currentStepIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-shrink-0"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {currentStepIndex + 1}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{currentStep.explanation}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default VisualizationEngine
