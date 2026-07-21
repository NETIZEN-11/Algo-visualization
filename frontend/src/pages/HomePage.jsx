import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaFire,
  FaTrophy,
  FaChartLine,
  FaCode,
  FaRocket,
  FaBolt,
  FaStar,
  FaArrowRight,
  FaCalendar,
  FaCheckCircle,
} from 'react-icons/fa'
import useAuthStore from '../store/useAuthStore'
import useProgressStore from '../store/useProgressStore'
import api from '../services/api'

function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { getAnalytics } = useProgressStore()

  const [dailyChallenge, setDailyChallenge] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Refetch when the user changes (login / logout / rehydrate).
  useEffect(() => {
    if (!user) {
      // Anonymous viewer — skip the auth-gated fetches.
      setIsLoading(false)
      return
    }
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Get analytics - only if authenticated
      if (user) {
        try {
          await getAnalytics()
        } catch (error) {
          console.log('Analytics not available:', error.message)
        }

        // Get daily challenge
        try {
          const challengeRes = await api.get('/gamification/daily-challenge')
          setDailyChallenge(challengeRes.data.data)
        } catch (error) {
          console.log('No daily challenge available')
        }
      }

      // Get recent activity (mock for now)
      setRecentActivity([
        { type: 'solved', problem: 'Two Sum', time: '2 hours ago' },
        { type: 'badge', badge: 'Array Master', time: '1 day ago' },
        { type: 'streak', days: 7, time: '2 days ago' },
      ])

      // Get recommendations
      setRecommendations([
        { title: 'Master Sliding Window', reason: 'Weak topic', difficulty: 'Medium' },
        { title: 'Practice DP Problems', reason: 'Improve accuracy', difficulty: 'Hard' },
        { title: 'Two Pointer Technique', reason: 'New pattern', difficulty: 'Easy' },
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="text-2xl text-white" />
        </div>
        {trend && (
          <span className="text-green-400 text-sm font-semibold">
            +{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
  )

  const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-full text-left bg-gradient-to-br ${color} rounded-xl p-6 border border-gray-800 hover:border-transparent transition-all duration-300`}
    >
      <Icon className="text-3xl text-white mb-3" />
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-200 text-sm">{description}</p>
    </motion.button>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{user?.name || 'Coder'}!</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Ready to level up your DSA skills? Let's crush some algorithms today! 🚀
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          icon={FaCode}
          label="Problems Solved"
          value={user?.problemStats?.total || 0}
          color="from-blue-500 to-blue-600"
          trend={12}
        />
        <StatCard
          icon={FaFire}
          label="Current Streak"
          value={`${user?.streak || 0} days`}
          color="from-orange-500 to-red-500"
        />
        <StatCard
          icon={FaTrophy}
          label="Level"
          value={user?.level || 1}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={FaStar}
          label="Total XP"
          value={user?.xp || 0}
          color="from-yellow-500 to-amber-500"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Challenge */}
          {dailyChallenge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-2xl p-8 border border-orange-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                    <FaCalendar className="text-2xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Today's Challenge</h2>
                    <p className="text-orange-400 text-sm">Complete for bonus XP!</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Reward</div>
                  <div className="text-xl font-bold text-orange-400">+{dailyChallenge.xpReward} XP</div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 mb-4">
                <h3 className="text-xl font-bold mb-2">{dailyChallenge.problemId?.title || 'Loading...'}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    dailyChallenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    dailyChallenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {dailyChallenge.difficulty}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {dailyChallenge.totalCompleted || 0} completed today
                  </span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2">
                  {dailyChallenge.problemId?.description || 'Challenge description...'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/daily-challenge')}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                Start Challenge
                <FaArrowRight />
              </motion.button>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionCard
                icon={FaCode}
                title="Solve Problems"
                description="Browse and solve DSA problems with AI assistance"
                color="from-blue-600 to-blue-700"
                onClick={() => navigate('/problem-solver')}
              />
              <QuickActionCard
                icon={FaBolt}
                title="Mock Interview"
                description="Practice with AI interviewer for FAANG prep"
                color="from-purple-600 to-purple-700"
                onClick={() => navigate('/interview')}
              />
              <QuickActionCard
                icon={FaRocket}
                title="Visualization Lab"
                description="See algorithms come to life with animations"
                color="from-green-600 to-green-700"
                onClick={() => navigate('/visualization')}
              />
              <QuickActionCard
                icon={FaChartLine}
                title="View Progress"
                description="Track your learning journey and weak topics"
                color="from-orange-600 to-red-600"
                onClick={() => navigate('/progress')}
              />
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                  >
                    {activity.type === 'solved' && (
                      <>
                        <FaCheckCircle className="text-2xl text-green-400" />
                        <div className="flex-1">
                          <p className="font-semibold">Solved "{activity.problem}"</p>
                          <p className="text-sm text-gray-400">{activity.time}</p>
                        </div>
                      </>
                    )}
                    {activity.type === 'badge' && (
                      <>
                        <FaTrophy className="text-2xl text-yellow-400" />
                        <div className="flex-1">
                          <p className="font-semibold">Earned "{activity.badge}" badge</p>
                          <p className="text-sm text-gray-400">{activity.time}</p>
                        </div>
                      </>
                    )}
                    {activity.type === 'streak' && (
                      <>
                        <FaFire className="text-2xl text-orange-400" />
                        <div className="flex-1">
                          <p className="font-semibold">{activity.days}-day streak milestone!</p>
                          <p className="text-sm text-gray-400">{activity.time}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">No recent activity. Start solving problems!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Right 1 column */}
        <div className="space-y-8">
          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">Easy</span>
                  <span className="text-gray-400">{user?.problemStats?.easy || 0}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((user?.problemStats?.easy || 0) * 2, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-yellow-400">Medium</span>
                  <span className="text-gray-400">{user?.problemStats?.medium || 0}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${Math.min((user?.problemStats?.medium || 0) * 2, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-red-400">Hard</span>
                  <span className="text-gray-400">{user?.problemStats?.hard || 0}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min((user?.problemStats?.hard || 0) * 3, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/progress')}
              className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
            >
              View Detailed Stats
            </motion.button>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <h3 className="font-semibold mb-1">{rec.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{rec.reason}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    rec.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {rec.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
