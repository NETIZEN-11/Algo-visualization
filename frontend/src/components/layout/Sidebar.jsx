import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaHome,
  FaCode,
  FaEye,
  FaMicrophone,
  FaBug,
  FaPlay,
  FaMap,
  FaChartLine,
  FaFire,
  FaTrophy,
  FaStickyNote,
  FaTrophy as FaBadge,
  FaBuilding,
  FaCog,
  FaStar,
  FaBell,
  FaUserShield,
} from 'react-icons/fa'
import useAuthStore from '../../store/useAuthStore'

const menuItems = [
  { path: '/', icon: FaHome, label: 'Dashboard', color: 'primary' },
  { path: '/problem-solver', icon: FaCode, label: 'Problem Solver', color: 'blue' },
  { path: '/visualization', icon: FaEye, label: 'Visualization Lab', color: 'purple' },
  { path: '/interview', icon: FaMicrophone, label: 'Mock Interview', color: 'orange' },
  { path: '/bug-detector', icon: FaBug, label: 'Bug Detector', color: 'red' },
  { path: '/playground', icon: FaPlay, label: 'Code Playground', color: 'green' },
  { path: '/roadmap', icon: FaMap, label: 'Topic Roadmap', color: 'yellow' },
  { path: '/progress', icon: FaChartLine, label: 'Progress Analytics', color: 'cyan' },
  { path: '/daily-challenge', icon: FaFire, label: 'Daily Challenge', color: 'orange' },
  { path: '/contest', icon: FaTrophy, label: 'Contest Mode', color: 'gold' },
  { path: '/notes', icon: FaStickyNote, label: 'Notes & Flashcards', color: 'pink' },
  { path: '/badges', icon: FaBadge, label: 'Badges & Achievements', color: 'purple' },
  { path: '/companies', icon: FaBuilding, label: 'Company Questions', color: 'blue' },
  { path: '/notifications', icon: FaBell, label: 'Notifications', color: 'yellow' },
  { path: '/settings', icon: FaCog, label: 'Settings', color: 'gray' },
]

const adminItem = { path: '/admin', icon: FaUserShield, label: 'Admin Console', color: 'red' }

function Sidebar() {
  const { user } = useAuthStore()

  const userStats = {
    problemsSolved: user?.problemStats?.total || 0,
    streak: user?.streak || 0,
    xp: user?.xp || 0,
    level: user?.level || 1,
  }

  const getLevelProgress = () => {
    // Mirrors backend USER_LEVELS (utils/constants.js). Each level has a minXP
    // threshold; we compute progress as (xp - currentMinXP) / (nextMinXP - currentMinXP).
    const USER_LEVELS = [
      { level: 1, minXP: 0 },
      { level: 2, minXP: 100 },
      { level: 3, minXP: 300 },
      { level: 4, minXP: 600 },
      { level: 5, minXP: 1000 },
      { level: 6, minXP: 1500 },
      { level: 7, minXP: 2500 },
      { level: 8, minXP: 4000 },
    ]
    const current = USER_LEVELS.find((l) => l.level === userStats.level) || USER_LEVELS[0]
    const next = USER_LEVELS.find((l) => l.level === userStats.level + 1)

    if (!next) return 100 // already at max level
    const progress = (userStats.xp - current.minXP) / (next.minXP - current.minXP)
    return Math.max(0, Math.min(100, progress * 100))
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto scrollbar-thin">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <FaCode className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              AlgoVision AI
            </h2>
            <p className="text-xs text-gray-400">AI DSA Tutor</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-3 space-y-1" aria-label="Main">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`text-lg transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      transition={{ type: 'spring', bounce: 0.2 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}

        {/* Admin link — only when the user has role === 'admin' */}
        {user?.role === 'admin' ? (
          <motion.div
            key={adminItem.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: menuItems.length * 0.03 }}
          >
            <NavLink
              to={adminItem.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-red-300 hover:bg-red-500/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <adminItem.icon className={`text-lg ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-medium text-sm">{adminItem.label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ) : null}
      </nav>

      {/* Quick Stats Card */}
      <div className="p-4 mt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Problems Solved</span>
              <span className="text-blue-400 font-bold text-lg">{userStats.problemsSolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Current Streak</span>
              <span className="text-orange-400 font-bold text-lg flex items-center gap-1">
                {userStats.streak} <FaFire className="text-orange-500" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total XP</span>
              <span className="text-yellow-400 font-bold text-lg flex items-center gap-1">
                {userStats.xp} <FaStar className="text-xs" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 mt-auto border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center space-x-3"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-950 rounded-full"></div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{user?.name || 'User'}</p>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-orange-400 font-semibold">Level {userStats.level}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{userStats.xp} XP</span>
            </div>
          </div>
        </motion.div>

        {/* XP Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Level {userStats.level}</span>
            <span>Level {userStats.level + 1}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getLevelProgress()}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.floor(getLevelProgress())}% to next level
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
