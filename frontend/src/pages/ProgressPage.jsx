import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FaTrophy,
  FaFire,
  FaBolt,
  FaCheckCircle,
  FaTimesCircle,
  FaCode,
  FaClock,
} from 'react-icons/fa'
import useProgressStore from '../store/useProgressStore'
import useAuthStore from '../store/useAuthStore'

function ProgressPage() {
  const { user } = useAuthStore()
  const { analytics, readinessScore, topicAnalysis, getAnalytics, getReadinessScore, getTopicAnalysis } = useProgressStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllData()

  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    try {

      const uid = user?._id || user?.id
      await Promise.all([
        getAnalytics(uid),
        getReadinessScore(uid),
        getTopicAnalysis(uid),
      ])
    } catch (error) {

      console.warn('Progress data unavailable:', error?.message)
    } finally {
      setIsLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, color, subtitle, trend }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="text-2xl text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm font-medium">{label}</div>
      {subtitle && (
        <div className="text-gray-500 text-xs mt-1">{subtitle}</div>
      )}
    </motion.div>
  )

  const DifficultyBar = ({ difficulty, solved, total, color }) => {
    const percentage = total > 0 ? (solved / total) * 100 : 0

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold text-${color}-400`}>{difficulty}</span>
          <span className="text-gray-400 text-sm">{solved} / {total}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full bg-${color}-500 rounded-full`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% complete</div>
      </div>
    )
  }

  const PatternMasteryCard = ({ pattern, level, accuracy, problemsSolved }) => {
    const levelColors = {
      beginner: 'from-gray-600 to-gray-700',
      intermediate: 'from-blue-600 to-blue-700',
      advanced: 'from-purple-600 to-purple-700',
      expert: 'from-orange-600 to-red-600',
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{pattern}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${levelColors[level]}`}>
            {level}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400">Accuracy</div>
            <div className="text-lg font-bold text-green-400">{accuracy}%</div>
          </div>
          <div>
            <div className="text-gray-400">Solved</div>
            <div className="text-lg font-bold text-blue-400">{problemsSolved}</div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const progress = analytics?.progress || {}
  const userProgress = progress?.overallStats || {}
  const patternMastery = progress?.patternMastery || []
  const weakTopics = topicAnalysis?.weakTopics || []
  const strongTopics = topicAnalysis?.strongTopics || []

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-8">
      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Progress Analytics
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Track your learning journey and identify areas for improvement
        </p>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          icon={FaCode}
          label="Total Problems"
          value={userProgress.totalProblemsSolved || user?.problemStats?.total || 0}
          color="from-blue-500 to-blue-600"
          subtitle="Keep going!"
          trend={12}
        />
        <StatCard
          icon={FaFire}
          label="Current Streak"
          value={`${userProgress.currentStreak || user?.streak || 0} days`}
          color="from-orange-500 to-red-500"
          subtitle="Don't break it!"
        />
        <StatCard
          icon={FaCheckCircle}
          label="Accuracy"
          value={`${(userProgress.averageAccuracy || 0).toFixed(1)}%`}
          color="from-green-500 to-green-600"
          subtitle="Excellent!"
          trend={5}
        />
        <StatCard
          icon={FaClock}
          label="Time Spent"
          value={`${Math.floor((userProgress.totalTimeSpent || 0) / 60)}h`}
          color="from-purple-500 to-pink-500"
          subtitle="This week"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-8">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaTrophy className="text-yellow-400" />
              Difficulty Breakdown
            </h2>

            <DifficultyBar
              difficulty="Easy"
              solved={user?.problemStats?.easy || 0}
              total={50}
              color="green"
            />
            <DifficultyBar
              difficulty="Medium"
              solved={user?.problemStats?.medium || 0}
              total={100}
              color="yellow"
            />
            <DifficultyBar
              difficulty="Hard"
              solved={user?.problemStats?.hard || 0}
              total={30}
              color="red"
            />
          </motion.div>

          {}
          {readinessScore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/30"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FaBolt className="text-yellow-400" />
                Interview Readiness Score
              </h2>

              <div className="text-center mb-6">
                <div className="text-6xl font-bold mb-2">
                  <span className={`${
                    readinessScore.overall_score >= 80 ? 'text-green-400' :
                    readinessScore.overall_score >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {readinessScore.overall_score}
                  </span>
                  <span className="text-gray-400">/100</span>
                </div>
                <p className="text-gray-400">
                  {readinessScore.estimated_readiness === 'expert' ? 'Interview Ready!' :
                   readinessScore.estimated_readiness === 'advanced' ? 'Almost There!' :
                   readinessScore.estimated_readiness === 'intermediate' ? 'Keep Practicing' :
                   'Need More Practice'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{readinessScore.data_structures_score}</div>
                  <div className="text-xs text-gray-400">Data Structures</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{readinessScore.algorithms_score}</div>
                  <div className="text-xs text-gray-400">Algorithms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{readinessScore.problem_solving_score}</div>
                  <div className="text-xs text-gray-400">Problem Solving</div>
                </div>
              </div>

              {readinessScore.strengths?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <FaCheckCircle /> Strengths
                  </h3>
                  <ul className="space-y-1">
                    {readinessScore.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {readinessScore.weaknesses?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <FaTimesCircle /> Areas to Improve
                  </h3>
                  <ul className="space-y-1">
                    {readinessScore.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {}
        <div className="space-y-8">
          {}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-xl font-bold mb-4">Pattern Mastery</h2>
            <div className="space-y-3">
              {patternMastery.length > 0 ? (
                patternMastery.slice(0, 6).map((pattern, index) => (
                  <PatternMasteryCard
                    key={index}
                    pattern={pattern.pattern}
                    level={pattern.masteryLevel}
                    accuracy={pattern.accuracy?.toFixed(1) || 0}
                    problemsSolved={pattern.problemsSolved}
                  />
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Start solving problems to track your pattern mastery!
                </p>
              )}
            </div>
          </motion.div>

          {}
          {weakTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-red-900/10 rounded-2xl p-6 border border-red-500/30"
            >
              <h2 className="text-xl font-bold mb-4 text-red-400">Weak Topics</h2>
              <div className="space-y-2">
                {weakTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="font-medium">{topic.pattern}</span>
                    <span className="text-red-400 text-sm">{topic.accuracy?.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {}
          {strongTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-green-900/10 rounded-2xl p-6 border border-green-500/30"
            >
              <h2 className="text-xl font-bold mb-4 text-green-400">Strong Topics</h2>
              <div className="space-y-2">
                {strongTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="font-medium">{topic.pattern}</span>
                    <span className="text-green-400 text-sm">{topic.accuracy?.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressPage
