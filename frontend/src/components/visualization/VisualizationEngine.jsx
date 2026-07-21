import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import ArrayVisualizer from './ArrayVisualizer'
import TreeVisualizer from './TreeVisualizer'
import GraphVisualizer from './GraphVisualizer'
import DPTableVisualizer from './DPTableVisualizer'
import LinkedListVisualizer from './LinkedListVisualizer'
import StackQueueVisualizer from './StackQueueVisualizer'
import VisualizationControls from './VisualizationControls'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye } from 'react-icons/fa'

function normalizeType(raw) {
  if (!raw) return 'array'
  const t = raw.toLowerCase().replace(/[\s/-]/g, '_')
  if (t.includes('sliding') || t.includes('window')) return 'sliding_window'
  if (t.includes('two') && t.includes('pointer')) return 'two_pointer'
  if (t.includes('linked') || t.includes('list')) return 'linkedlist'
  if (t.includes('binary_search_tree') || t === 'bst') return 'tree'
  if (t.includes('heap') || t.includes('priority')) return 'array'
  if (t.includes('trie')) return 'tree'
  if (t.includes('union')) return 'graph'
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
  if (t.includes('binary')) return 'array'
  if (t.includes('array') || t.includes('string')) return 'array'
  return 'array'
}

const MAX_HISTORY = 100

function VisualizationEngine({
  visualizationData,
  type,
  onStepChange,
  initialStep = 0,
  autoPlay = false,
  showAdvancedControls = true,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(
    Math.min(Math.max(0, initialStep), (visualizationData?.steps?.length || 1) - 1)
  )
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)

  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const normalizedType = normalizeType(type)
  const steps = useMemo(() => visualizationData?.steps || [], [visualizationData])
  const totalSteps = steps.length

  const lastDataRef = useRef(visualizationData)
  useEffect(() => {
    if (lastDataRef.current !== visualizationData) {
      lastDataRef.current = visualizationData
      setCurrentStepIndex(Math.min(Math.max(0, initialStep), (steps.length || 1) - 1))
      setIsPlaying(autoPlay)
      setPast([])
      setFuture([])
    }
  }, [visualizationData, steps.length, initialStep, autoPlay])

  const navigate = useCallback((next) => {
    setPast((p) => {
      const trimmed = p.length >= MAX_HISTORY ? p.slice(p.length - MAX_HISTORY + 1) : p
      return [...trimmed, currentStepIndex]
    })
    setFuture([])
    setCurrentStepIndex(next)
  }, [currentStepIndex])

  const handleUndo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]
      setFuture((f) => [currentStepIndex, ...f])
      setCurrentStepIndex(prev)
      return p.slice(0, -1)
    })
  }, [currentStepIndex])

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setPast((p) => [...p, currentStepIndex])
      setCurrentStepIndex(next)
      return f.slice(1)
    })
  }, [currentStepIndex])

  useEffect(() => {
    onStepChange?.(currentStepIndex, steps[currentStepIndex])
  }, [currentStepIndex, steps, onStepChange])

  useEffect(() => {
    if (!isPlaying || currentStepIndex >= totalSteps - 1) {
      if (currentStepIndex >= totalSteps - 1 && loop && totalSteps > 1) {

        const id = setTimeout(() => {
          setCurrentStepIndex(0)
        }, 250)
        return () => clearTimeout(id)
      }
      if (currentStepIndex >= totalSteps - 1) setIsPlaying(false)
      return
    }
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / speed)
    return () => clearInterval(interval)
  }, [isPlaying, currentStepIndex, totalSteps, speed, loop])

  useEffect(() => {
    const handleKeyPress = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      const mod = e.metaKey || e.ctrlKey
      switch (e.key) {
        case ' ':
          e.preventDefault()
          setIsPlaying((prev) => !prev)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (mod) setCurrentStepIndex((p) => Math.min(p + 5, totalSteps - 1))
          else navigate(Math.min(currentStepIndex + 1, totalSteps - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (mod) setCurrentStepIndex((p) => Math.max(p - 5, 0))
          else navigate(Math.max(currentStepIndex - 1, 0))
          break
        case 'r':
        case 'R':
          e.preventDefault()
          setIsPlaying(false)
          setCurrentStepIndex(0)
          setPast([])
          setFuture([])
          break
        case 'z':
        case 'Z':
          if (mod) {
            e.preventDefault()
            if (e.shiftKey) handleRedo()
            else handleUndo()
          }
          break
        case 'l':
        case 'L':
          e.preventDefault()
          setLoop((l) => !l)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)

  }, [totalSteps, handleUndo, handleRedo])

  const handlePlay = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0)
      setPast([])
      setFuture([])
    }
    setIsPlaying(true)
  }, [currentStepIndex, totalSteps])

  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleNext = useCallback(() => {
    setIsPlaying(false)
    navigate(Math.min(currentStepIndex + 1, totalSteps - 1))
  }, [navigate, currentStepIndex, totalSteps])
  const handlePrevious = useCallback(() => {
    setIsPlaying(false)
    navigate(Math.max(currentStepIndex - 1, 0))
  }, [navigate, currentStepIndex])
  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setCurrentStepIndex(0)
    setPast([])
    setFuture([])
  }, [])
  const handleSpeedChange = useCallback((s) => setSpeed(s), [])
  const handleJump = useCallback((step) => {
    setIsPlaying(false)
    navigate(Math.max(0, Math.min(totalSteps - 1, step)))
  }, [navigate, totalSteps])
  const handleToggleLoop = useCallback(() => setLoop((l) => !l), [])

  if (!visualizationData || totalSteps === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
        <div className="text-center text-gray-400 px-6">
          <FaEye className="text-5xl mx-auto mb-4 text-purple-500/40" />
          <p className="font-semibold mb-1">No visualization steps available</p>
          <p className="text-sm text-gray-500">
            Paste a problem in the Dynamic Viz lab, configure your OpenAI key, or use
            mock mode to see the analysis.
          </p>
        </div>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex] || {}

  const renderVisualizer = () => {
    const commonProps = {
      currentStep,
      highlights: currentStep?.highlight || currentStep?.highlights || {},
    }

    switch (normalizedType) {
      case 'array':
      case 'sliding_window':
      case 'two_pointer': {
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
      {}
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

      {}
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
        loop={loop}
        onToggleLoop={showAdvancedControls ? handleToggleLoop : undefined}
        onJump={handleJump}
        onUndo={showAdvancedControls ? handleUndo : undefined}
        onRedo={showAdvancedControls ? handleRedo : undefined}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        steps={steps}
        stepTitles={steps.map((s) => s.title || s.explanation || '')}
      />

      {}
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
