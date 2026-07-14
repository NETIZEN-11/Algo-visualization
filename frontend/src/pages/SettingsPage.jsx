import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaUser, FaEnvelope, FaCog, FaTrash, FaBell, FaPalette, FaShieldAlt,
  FaLock, FaSignOutAlt,
} from 'react-icons/fa'
import useAuthStore from '../store/useAuthStore'
import { authService } from '../services/authService'
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter'
import toast from 'react-hot-toast'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, logout, logoutAll, deleteAccount } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isSaving, setIsSaving] = useState(false)

  // Change-password state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  // Delete-account confirmation
  const [confirmText, setConfirmText] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('algo-prefs') || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await authService.updateProfile({ name, email })
      updateUser(res.user || { name, email })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setPwBusy(true)
    try {
      await authService.changePassword({ currentPassword: currentPw, newPassword: newPw })
      toast.success('Password changed — other sessions have been signed out.')
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password')
    } finally {
      setPwBusy(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of every device? You will need to log in again here too.')) return
    await logoutAll()
    navigate('/login')
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleteBusy(true)
    try {
      await deleteAccount()
      navigate('/login')
      toast.success('Account deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account')
    } finally {
      setDeleteBusy(false)
    }
  }

  const updatePref = (key, value) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    localStorage.setItem('algo-prefs', JSON.stringify(next))
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaCog className="text-orange-400" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Settings
          </span>
        </h1>
        <p className="text-gray-400">Manage your profile, security, and preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-blue-400" /> Profile
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="settings-name" className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  id="settings-email"
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
                {user && !user.emailVerified ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try { await authService.resendVerification(); toast.success('Verification email sent') }
                      catch (e) { toast.error(e.response?.data?.message || 'Could not send') }
                    }}
                    className="text-xs text-yellow-400 hover:underline mt-1"
                  >
                    Email not verified — resend verification link
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaLock className="text-emerald-400" /> Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="settings-current-pw" className="block text-sm text-gray-400 mb-1">Current password</label>
                <input
                  id="settings-current-pw"
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label htmlFor="settings-new-pw" className="block text-sm text-gray-400 mb-1">New password</label>
                <input
                  id="settings-new-pw"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
                <PasswordStrengthMeter password={newPw} userInputs={[user?.name, user?.email]} />
              </div>
              <button
                type="submit"
                disabled={pwBusy || !currentPw || !newPw}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 disabled:opacity-50 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {pwBusy ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaPalette className="text-purple-400" /> Preferences
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2 text-sm">
                  <FaBell className="text-yellow-400" /> Daily reminder
                </span>
                <input
                  type="checkbox"
                  checked={!!preferences.dailyReminder}
                  onChange={(e) => updatePref('dailyReminder', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2 text-sm">
                  <FaPalette className="text-blue-400" /> Compact mode
                </span>
                <input
                  type="checkbox"
                  checked={!!preferences.compact}
                  onChange={(e) => updatePref('compact', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
              <div className="p-3 bg-gray-800 rounded-lg">
                <label htmlFor="settings-lang" className="block text-sm mb-2">Preferred language</label>
                <select
                  id="settings-lang"
                  value={preferences.language || 'python'}
                  onChange={(e) => updatePref('language', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2">
                <span className="text-gray-400">Level</span>
                <span className="font-semibold">{user?.level || 1}</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-gray-400">XP</span>
                <span className="font-semibold">{user?.xp || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-gray-400">Streak</span>
                <span className="font-semibold">{user?.streak || 0} 🔥</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-gray-400">Role</span>
                <span className="font-semibold capitalize">{user?.role || 'user'}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <FaSignOutAlt /> Log out
              </button>
              <button
                onClick={handleLogoutAll}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <FaShieldAlt /> Sign out of all devices
              </button>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-300">
              <FaShieldAlt /> Danger Zone
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Permanently delete your account and all data. Cannot be undone.
            </p>
            <label htmlFor="settings-delete" className="block text-xs text-gray-400 mb-1">
              Type <code className="text-red-300">DELETE</code> to confirm:
            </label>
            <input
              id="settings-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full mb-3 px-3 py-2 bg-gray-900 border border-red-500/40 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleDelete}
              disabled={deleteBusy || confirmText !== 'DELETE'}
              className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaTrash /> {deleteBusy ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
