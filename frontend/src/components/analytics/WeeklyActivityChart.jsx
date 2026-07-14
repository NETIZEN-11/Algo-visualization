import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

function WeeklyActivityChart({ weeklyData }) {
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Weekly Activity</h3>
        <div className="text-center py-12 text-gray-400">
          <p>No activity data available yet</p>
        </div>
      </div>
    )
  }

  // Get last 4 weeks of data
  const recentWeeks = weeklyData.slice(-4).map((week, index) => ({
    week: `Week ${index + 1}`,
    problems: week.problemsSolved || 0,
    timeSpent: Math.round((week.timeSpent || 0) / 60), // Convert to hours
    xp: week.xpEarned || 0,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white mb-2">{data.week}</p>
          <p className="text-sm text-blue-400">
            Problems: <span className="font-bold">{data.problems}</span>
          </p>
          <p className="text-sm text-purple-400">
            Time: <span className="font-bold">{data.timeSpent}h</span>
          </p>
          <p className="text-sm text-green-400">
            XP: <span className="font-bold">{data.xp}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const totalProblems = recentWeeks.reduce((sum, w) => sum + w.problems, 0)
  const totalTime = recentWeeks.reduce((sum, w) => sum + w.timeSpent, 0)

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-400">{totalProblems} problems</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-400">{totalTime}h spent</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentWeeks}>
            <defs>
              <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Area
              type="monotone"
              dataKey="problems"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorProblems)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Activity Heatmap */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-400 mb-3">Daily Consistency</p>
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="text-center">
              <p className="text-xs text-gray-500 mb-2">{day}</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`h-12 rounded-lg ${
                  index < 5
                    ? 'bg-green-500/30 border border-green-500/50'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeeklyActivityChart
