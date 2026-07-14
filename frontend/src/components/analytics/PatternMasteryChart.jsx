import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

function PatternMasteryChart({ patternData }) {
  if (!patternData || patternData.length === 0) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pattern Mastery</h3>
        <div className="text-center py-12 text-gray-400">
          <p>No pattern data available yet</p>
          <p className="text-sm mt-2">Start solving problems to see your progress!</p>
        </div>
      </div>
    )
  }

  // Take top 8 patterns for better visualization
  const topPatterns = patternData
    .slice(0, 8)
    .map(p => ({
      pattern: p.pattern.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      accuracy: Math.round(p.accuracy),
      solved: p.problemsSolved,
      masteryLevel: p.masteryLevel,
    }))

  const getMasteryColor = (level) => {
    switch (level) {
      case 'expert':
        return 'text-purple-400'
      case 'advanced':
        return 'text-blue-400'
      case 'intermediate':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white mb-2">{data.pattern}</p>
          <p className="text-sm text-gray-300">
            Accuracy: <span className="font-bold text-white">{data.accuracy}%</span>
          </p>
          <p className="text-sm text-gray-300">
            Solved: <span className="font-bold text-white">{data.solved}</span>
          </p>
          <p className="text-sm text-gray-300">
            Level: <span className={`font-bold ${getMasteryColor(data.masteryLevel)}`}>
              {data.masteryLevel}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Pattern Mastery</h3>

      {/* Radar Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={topPatterns}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="pattern"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Accuracy"
              dataKey="accuracy"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern List */}
      <div className="mt-6 space-y-2">
        {topPatterns.map((pattern, index) => (
          <motion.div
            key={pattern.pattern}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-300">{pattern.pattern}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className={`font-semibold ${getMasteryColor(pattern.masteryLevel)}`}>
                {pattern.masteryLevel}
              </span>
              <span className="text-gray-500">{pattern.solved} solved</span>
              <span className="text-gray-400">{pattern.accuracy}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PatternMasteryChart
