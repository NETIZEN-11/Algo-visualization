import { motion } from 'framer-motion'
import { FaTrophy, FaStar, FaFire, FaPercent } from 'react-icons/fa'

function OverviewStats({ progress, user }) {
  const stats = [
    {
      label: 'Total Solved',
      value: progress?.overallStats?.totalProblemsSolved || 0,
      icon: FaTrophy,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Current Level',
      value: user?.level || 1,
      icon: FaStar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Day Streak',
      value: progress?.overallStats?.currentStreak || 0,
      icon: FaFire,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
    },
    {
      label: 'Accuracy',
      value: `${Math.round(progress?.overallStats?.averageAccuracy || 0)}%`,
      icon: FaPercent,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.bgColor} border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
            >
              <stat.icon className="text-white text-2xl" />
            </div>
          </div>

          {/* Progress indicator for XP */}
          {stat.label === 'Current Level' && user && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>XP: {user.xp}</span>
                <span>Next: {user.level * 1000}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((user.xp % (user.level * 1000)) / (user.level * 1000)) * 100}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default OverviewStats
