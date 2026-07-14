import { motion } from 'framer-motion'
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo } from 'react-icons/fa'

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
  disabled = false,
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Reset */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          disabled={disabled}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Reset"
        >
          <FaRedo className="text-lg" />
        </motion.button>

        {/* Previous */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrevious}
          disabled={disabled || currentStep === 0}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Step"
        >
          <FaStepBackward className="text-lg" />
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || currentStep >= totalSteps - 1}
          className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <FaPause className="text-xl" />
          ) : (
            <FaPlay className="text-xl ml-1" />
          )}
        </motion.button>

        {/* Next */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          disabled={disabled || currentStep >= totalSteps - 1}
          className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Step"
        >
          <FaStepForward className="text-lg" />
        </motion.button>
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
          max="2"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.25x</span>
          <span>0.5x</span>
          <span>1x</span>
          <span>1.5x</span>
          <span>2x</span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Space</kbd> Play/Pause •{' '}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←</kbd> Previous •{' '}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">→</kbd> Next
        </p>
      </div>
    </div>
  )
}

export default VisualizationControls
