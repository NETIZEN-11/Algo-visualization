import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo,
  FaUndo, FaRedoAlt, FaSync,
} from 'react-icons/fa'

/**
 * Visualization controls — full bar.
 *
 * Adds on top of the previous minimal controls:
 *   - Undo / Redo (history stack — only meaningful when the page wires
 *     the history callbacks)
 *   - Loop toggle (auto-restart at the end)
 *   - Jump-to-step via the progress bar (click anywhere)
 *   - Minimap (timeline strip) — visible above the controls
 *   - Fit / expand toggles the inline minimap visibility
 *
 * The component is fully controlled — every button is a callback.
 */
function VisualizationControls({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onReset,
  currentStep,
  totalSteps,
  speed,
  onSpeedChange,
  loop = false,
  onToggleLoop,
  onJump,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  disabled = false,
  steps = [],          // for the minimap
  stepTitles = [],     // for the minimap tooltip
}) {
  const barRef = useRef(null)

  const handleBarClick = useCallback((e) => {
    if (!onJump || !barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    const step = Math.round(ratio * (totalSteps - 1))
    onJump(step)
  }, [onJump, totalSteps])

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Minimap / progress bar — clickable */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div
          ref={barRef}
          onClick={handleBarClick}
          className="relative h-6 bg-gray-700 rounded-full overflow-hidden cursor-pointer group"
          role="slider"
          aria-label="Step progress"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          tabIndex={0}
        >
          {/* Filled */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
          {/* Step ticks (minimap) */}
          {steps.length > 0 && steps.length <= 60 && (
            <div className="absolute inset-0 flex pointer-events-none">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-900/40 last:border-r-0"
                  title={stepTitles[i] || `Step ${i + 1}`}
                />
              ))}
            </div>
          )}
          {/* Hover preview */}
          <div
            className="absolute inset-y-0 right-0 w-1 bg-white/0 group-hover:bg-white/20 transition-colors"
            aria-hidden
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          disabled={disabled}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Reset (R)"
        >
          <FaRedo className="text-lg" />
        </motion.button>

        {onUndo && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUndo}
            disabled={disabled || !canUndo}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo (Cmd/Ctrl+Z)"
            aria-label="Undo"
          >
            <FaUndo className="text-lg" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrevious}
          disabled={disabled || currentStep === 0}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous (←)"
        >
          <FaStepBackward className="text-lg" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || (!isPlaying && currentStep >= totalSteps - 1)}
          className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl ml-1" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          disabled={disabled || currentStep >= totalSteps - 1}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next (→)"
        >
          <FaStepForward className="text-lg" />
        </motion.button>

        {onRedo && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRedo}
            disabled={disabled || !canRedo}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Redo (Cmd/Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <FaRedoAlt className="text-lg" />
          </motion.button>
        )}

        {onToggleLoop && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLoop}
            disabled={disabled}
            className={`p-3 rounded-lg text-white transition-colors ${
              loop
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={loop ? 'Loop on' : 'Loop off'}
            aria-label="Toggle loop"
            aria-pressed={loop}
          >
            <FaSync className="text-lg" />
          </motion.button>
        )}
      </div>

      {/* Speed control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-400">Speed</label>
          <span className="text-xs text-gray-400">{speed}x</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.25x</span><span>1x</span><span>2x</span><span>3x</span><span>4x</span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Space</kbd> Play/Pause •{' '}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←</kbd> Previous •{' '}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">→</kbd> Next •{' '}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">R</kbd> Reset
        </p>
      </div>
    </div>
  )
}

export default VisualizationControls
