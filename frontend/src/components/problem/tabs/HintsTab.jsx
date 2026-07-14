import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLightbulb, FaLock, FaUnlock, FaSpinner } from 'react-icons/fa'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const hintLevels = [
  { level: 1, label: 'Hint 1', description: 'Subtle nudge' },
  { level: 2, label: 'Hint 2', description: 'Point to approach' },
  { level: 3, label: 'Hint 3', description: 'Reveal key insight' },
  { level: 4, label: 'Solution', description: 'Full explanation' },
]

function HintsTab({ problemData }) {
  const [unlockedLevels, setUnlockedLevels] = useState([])
  const [hints, setHints] = useState({})
  const [loading, setLoading] = useState(false)

  const handleUnlockHint = async (level) => {
    if (unlockedLevels.includes(level) || !problemData) return

    setLoading(true)

    try {
      const response = await api.post('/ai/hints', {
        problemData,
        hintLevel: level,
      })

      const hintData = response.data.data

      setHints((prev) => ({ ...prev, [level]: hintData.hint }))
      setUnlockedLevels((prev) => [...prev, level])
    } catch (error) {
      console.error('Error getting hint:', error)
      toast.error('Failed to generate hint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <FaLightbulb />
          Progressive Hints System
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          Get hints at your own pace. Each level reveals more information to help you solve
          the problem yourself.
        </p>
      </div>

      {/* Hint Levels */}
      <div className="space-y-3">
        {hintLevels.map((hintLevel) => {
          const isUnlocked = unlockedLevels.includes(hintLevel.level)
          const canUnlock = hintLevel.level === 1 || unlockedLevels.includes(hintLevel.level - 1)

          return (
            <motion.div
              key={hintLevel.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: hintLevel.level * 0.1 }}
              className={`border rounded-xl overflow-hidden ${
                isUnlocked
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              {/* Header */}
              <div
                className={`px-4 py-3 flex items-center justify-between ${
                  isUnlocked ? 'bg-green-500/20' : 'bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isUnlocked ? <FaUnlock /> : <FaLock />}
                  </div>
                  <div>
                    <p className="font-bold text-white">{hintLevel.label}</p>
                    <p className="text-xs text-gray-400">{hintLevel.description}</p>
                  </div>
                </div>

                {!isUnlocked && canUnlock && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUnlockHint(hintLevel.level)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      'Unlock'
                    )}
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <AnimatePresence>
                {isUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-3 bg-gray-900/50"
                  >
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {hints[hintLevel.level] || 'Loading hint...'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Strategy Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
      >
        <h4 className="text-sm font-bold text-purple-400 mb-2">💡 Problem-Solving Tips</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-400">•</span>
            <span>Try to solve on your own before unlocking hints</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">•</span>
            <span>Start with drawing examples and patterns</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">•</span>
            <span>Think about edge cases and constraints</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">•</span>
            <span>Consider time and space complexity trade-offs</span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

export default HintsTab
