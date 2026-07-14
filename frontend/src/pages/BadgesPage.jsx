import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FaTrophy,
  FaStar,
  FaFire,
  FaCode,
  FaChartLine,
  FaCrown,
  FaRocket,
  FaBolt,
  FaLock,
  FaCheckCircle,
} from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

function BadgesPage() {
  const [userBadges, setUserBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, earned, locked

  useEffect(() => {
    loadBadges()
  }, [])

  const loadBadges = async () => {
    setIsLoading(true)
    try {
      const [userRes, allRes] = await Promise.all([
        api.get('/gamification/badges'),
        api.get('/gamification/badges/all'),
      ])

      setUserBadges(userRes.data.data || [])
      setAllBadges(allRes.data.data || [])
    } catch (error) {
      // 401 is expected when the user is not authenticated — the
      // route guard will redirect them to /login. Don't show a toast
      // for that case; only toast on real server errors.
      const status = error?.response?.status
      if (status && status !== 401) {
        toast.error('Failed to load badges')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getBadgeIcon = (category) => {
    const icons = {
      problems: FaCode,
      difficulty: FaTrophy,
      pattern: FaStar,
      streak: FaFire,
      achievement: FaCrown,
      special: FaRocket,
      performance: FaChartLine,
      speed: FaBolt,
    }
    return icons[category] || FaTrophy
  }

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-amber-700 to-amber-800',
      silver: 'from-gray-400 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-blue-400 to-purple-500',
      diamond: 'from-cyan-400 to-blue-600',
    }
    return colors[tier] || 'from-gray-600 to-gray-700'
  }

  const isEarned = (badgeId) => {
    return userBadges.some(b => b.id === badgeId)
  }

  const getEarnedDate = (badgeId) => {
    const badge = userBadges.find(b => b.id === badgeId)
    return badge?.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : null
  }

  const BadgeCard = ({ badge, earned }) => {
    const Icon = getBadgeIcon(badge.category)
    const tierColor = getTierColor(badge.tier)

    return (
      <motion.div
        whileHover={{ y: -4, scale: earned ? 1.05 : 1.02 }}
        className={`relative rounded-2xl p-6 border-2 transition-all ${
          earned
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500 shadow-lg shadow-orange-500/20'
            : 'bg-gray-900/50 border-gray-800 opacity-60'
        }`}
      >
        {/* Earned Badge */}
        {earned && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#0B1120]">
            <FaCheckCircle className="text-white text-sm" />
          </div>
        )}

        {/* Lock Icon for Locked Badges */}
        {!earned && (
          <div className="absolute top-4 right-4">
            <FaLock className="text-gray-600 text-xl" />
          </div>
        )}

        {/* Badge Icon */}
        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tierColor} flex items-center justify-center ${!earned && 'grayscale'}`}>
          <Icon className="text-4xl text-white" />
        </div>

        {/* Badge Details */}
        <h3 className={`text-xl font-bold mb-2 text-center ${earned ? 'text-white' : 'text-gray-500'}`}>
          {badge.name}
        </h3>
        
        <p className={`text-sm text-center mb-4 ${earned ? 'text-gray-400' : 'text-gray-600'}`}>
          {badge.description}
        </p>

        {/* Tier Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${tierColor}`}>
            {badge.tier?.toUpperCase() || 'BRONZE'}
          </span>
        </div>

        {/* Criteria */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-400 text-center">
            <span className="font-semibold">Requirement:</span> {badge.criteria?.description || 'Complete special achievement'}
          </p>
        </div>

        {/* XP Reward */}
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <FaStar />
          <span className="font-bold">+{badge.xpReward || 0} XP</span>
        </div>

        {/* Earned Date */}
        {earned && getEarnedDate(badge.id) && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              Earned on {getEarnedDate(badge.id)}
            </p>
          </div>
        )}
      </motion.div>
    )
  }

  const filteredBadges = allBadges.filter(badge => {
    if (filter === 'all') return true
    if (filter === 'earned') return isEarned(badge.id)
    if (filter === 'locked') return !isEarned(badge.id)
    return true
  })

  const earnedCount = allBadges.filter(b => isEarned(b.id)).length
  const totalCount = allBadges.length
  const completionPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading badges...</p>
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
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <FaTrophy className="text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Badges & Achievements
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Collect badges by completing challenges and milestones
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-2xl p-8 border border-orange-500/30 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-400 mb-2">{earnedCount}</div>
            <div className="text-gray-400">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-yellow-400 mb-2">{totalCount}</div>
            <div className="text-gray-400">Total Badges</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-green-400 mb-2">{completionPercentage.toFixed(0)}%</div>
            <div className="text-gray-400">Collection Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 mb-8"
      >
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Badges ({totalCount})
        </button>
        <button
          onClick={() => setFilter('earned')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            filter === 'earned'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Earned ({earnedCount})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            filter === 'locked'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Locked ({totalCount - earnedCount})
        </button>
      </motion.div>

      {/* Badges Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <BadgeCard badge={badge} earned={isEarned(badge.id)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FaTrophy className="text-6xl text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No badges to display</p>
          </div>
        )}
      </motion.div>

      {/* Motivation Section */}
      {earnedCount < totalCount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-purple-500/30 text-center"
        >
          <h2 className="text-2xl font-bold mb-3">Keep Going!</h2>
          <p className="text-gray-400 mb-4">
            You're {totalCount - earnedCount} badges away from completing your collection.
            Keep solving problems and achieving milestones!
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>💪 Stay consistent</span>
            <span>•</span>
            <span>🎯 Set daily goals</span>
            <span>•</span>
            <span>🚀 Challenge yourself</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default BadgesPage
