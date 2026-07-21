import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBrain, FaBell, FaSignOutAlt, FaCog, FaMoon, FaSun } from 'react-icons/fa'
import useAuthStore from '../../store/useAuthStore'
import { useUnreadCount } from '../../services/notificationService'
import { useTheme } from '../../hooks/useTheme'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const { theme, toggle: toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const goTo = (path) => {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 backdrop-blur-sm bg-opacity-90">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <FaBrain className="text-xl text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              AlgoVision AI
            </span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center space-x-3">
              {}
              <button
                onClick={toggleTheme}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
              </button>

              {}
              <Link
                to="/notifications"
                className="relative text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-label={unread > 0 ? `Open notifications (${unread} unread)` : 'Open notifications'}
              >
                <FaBell className="text-xl" aria-hidden="true" />
                {unread > 0 ? (
                  <span
                    className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold"
                    aria-hidden="true"
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </Link>

              {}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold hover:scale-105 transition-transform focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label={`Open profile menu for ${user?.name || 'user'}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span aria-hidden="true">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </button>

                <AnimatePresence>
                  {menuOpen ? (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm font-semibold text-gray-100 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <p className="text-xs text-orange-400 mt-1">Level {user?.level || 1} · {user?.xp || 0} XP</p>
                      </div>
                      <button
                        role="menuitem"
                        onClick={() => goTo('/settings')}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
                      >
                        <FaCog aria-hidden="true" /> Settings
                      </button>
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none"
                      >
                        <FaSignOutAlt aria-hidden="true" /> Log out
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
