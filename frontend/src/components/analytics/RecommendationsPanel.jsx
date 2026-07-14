import { motion } from 'framer-motion'
import { FaLightbulb, FaArrowRight } from 'react-icons/fa'

function RecommendationsPanel({ recommendations }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
      case 'medium':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' }
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' }
    }
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaLightbulb className="text-yellow-400" />
        <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
      </div>

      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const colors = getPriorityColor(rec.priority)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${colors.bg} border ${colors.border} rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">
                      {rec.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${colors.text}`}>
                        {rec.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <FaArrowRight className={`text-xs ${colors.text}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FaLightbulb className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No recommendations yet</p>
          <p className="text-xs text-gray-600 mt-1">Keep solving problems to get personalized tips!</p>
        </div>
      )}
    </div>
  )
}

export default RecommendationsPanel
