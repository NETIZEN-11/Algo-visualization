import { motion } from 'framer-motion'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'

function TopicStrengthAnalysis({ weakTopics, strongTopics }) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Topic Strength</h3>

      {}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaArrowUp className="text-green-400" />
          <h4 className="text-sm font-semibold text-green-400">Strong Topics</h4>
        </div>
        {strongTopics && strongTopics.length > 0 ? (
          <div className="space-y-2">
            {strongTopics.map((topic, index) => (
              <motion.div
                key={topic.pattern}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{topic.pattern}</span>
                  <span className="text-xs text-green-400 font-bold">
                    {Math.round(topic.accuracy)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.accuracy}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-green-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {topic.problemsSolved} problems solved
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Keep solving to build strengths!</p>
        )}
      </div>

      {}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FaArrowDown className="text-red-400" />
          <h4 className="text-sm font-semibold text-red-400">Needs Improvement</h4>
        </div>
        {weakTopics && weakTopics.length > 0 ? (
          <div className="space-y-2">
            {weakTopics.map((topic, index) => (
              <motion.div
                key={topic.pattern}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{topic.pattern}</span>
                  <span className="text-xs text-red-400 font-bold">
                    {Math.round(topic.accuracy)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.accuracy}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-red-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {topic.problemsSolved} problems solved • Focus here!
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No weak topics identified yet</p>
        )}
      </div>
    </div>
  )
}

export default TopicStrengthAnalysis
