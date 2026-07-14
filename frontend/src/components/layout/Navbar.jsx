import { Link, useNavigate } from 'react-router-dom'
import { FaBrain, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa'
import useAuthStore from '../../store/useAuthStore'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
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
            <div className="flex items-center space-x-6">
              {/* Notifications — icon-only, needs aria-label */}
              <Link
                to="/notifications"
                className="relative text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-label="Open notifications (3 unread)"
              >
                <FaBell className="text-xl" aria-hidden="true" />
                <span
                  className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold"
                  aria-hidden="true"
                >
                  3
                </span>
              </Link>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-200">{user?.name}</p>
                  <p className="text-xs text-orange-400">Level {user?.level || 1}</p>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold hover:scale-105 transition-transform focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label={`Open profile menu for ${user?.name || 'user'}`}
                >
                  <span aria-hidden="true">{user?.name?.charAt(0).toUpperCase()}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500"
                  title="Logout"
                  aria-label="Log out"
                >
                  <FaSignOutAlt className="text-xl" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
