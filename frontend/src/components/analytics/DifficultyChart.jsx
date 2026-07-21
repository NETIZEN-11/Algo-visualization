import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function DifficultyChart({ difficultyData }) {
  if (!difficultyData) return null

  const data = [
    {
      name: 'Easy',
      solved: difficultyData.easy?.solved || 0,
      attempted: difficultyData.easy?.attempted || 0,
      accuracy: difficultyData.easy?.accuracy || 0,
      color: '#10b981',
    },
    {
      name: 'Medium',
      solved: difficultyData.medium?.solved || 0,
      attempted: difficultyData.medium?.attempted || 0,
      accuracy: difficultyData.medium?.accuracy || 0,
      color: '#f59e0b',
    },
    {
      name: 'Hard',
      solved: difficultyData.hard?.solved || 0,
      attempted: difficultyData.hard?.attempted || 0,
      accuracy: difficultyData.hard?.accuracy || 0,
      color: '#ef4444',
    },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white mb-2">{data.name}</p>
          <p className="text-sm text-gray-300">
            Solved: <span className="font-bold text-white">{data.solved}</span>
          </p>
          <p className="text-sm text-gray-300">
            Attempted: <span className="font-bold text-white">{data.attempted}</span>
          </p>
          <p className="text-sm text-gray-300">
            Accuracy: <span className="font-bold text-white">{Math.round(data.accuracy)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Difficulty Breakdown</h3>

      {}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-semibold text-gray-400">{item.name}</span>
            </div>
            <p className="text-2xl font-bold text-white">{item.solved}</p>
            <p className="text-xs text-gray-500">
              {item.attempted > 0 ? `${Math.round(item.accuracy)}% accuracy` : 'No attempts yet'}
            </p>
          </motion.div>
        ))}
      </div>

      {}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar dataKey="solved" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DifficultyChart
