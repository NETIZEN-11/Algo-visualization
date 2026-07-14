import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaUsersCog, FaSync, FaTrophy, FaChartBar, FaSearch, FaUserShield } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { adminService } from '../services/adminService'
import useAuthStore from '../store/useAuthStore'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Admin page — only mounted when the current user has role === 'admin'.
 * The backend returns 403 for non-admins; we also hide the nav link.
 */
function AdminPage() {
  const reduceMotion = useReducedMotion()
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([
        adminService.listUsers({ limit: 100 }),
        adminService.getStats().catch(() => ({ data: null })),
      ])
      setUsers(Array.isArray(u.data) ? u.data : (u.data?.data || []))
      setStats(s.data || s)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin data unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRoleChange = async (id, role) => {
    try {
      await adminService.updateUserRole(id, role)
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)))
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update role')
    }
  }

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8">
        <div className="max-w-md mx-auto text-center mt-20">
          <FaUserShield className="text-6xl text-red-400 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold mb-2">Admin only</h1>
          <p className="text-gray-400">You need administrator privileges to view this page.</p>
        </div>
      </div>
    )
  }

  const filtered = users.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FaUsersCog className="text-orange-400" aria-hidden="true" />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Admin Console
            </span>
          </h1>
          <p className="text-gray-400">Manage users, roles, badges, and platform stats.</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" aria-label="Refresh">
          <FaSync className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {stats ? (
        <section aria-label="Platform stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="text-xs uppercase text-gray-400 mb-1 flex items-center gap-1"><FaChartBar /> Users</div>
            <div className="text-2xl font-bold">{stats.users ?? stats.totalUsers ?? '—'}</div>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="text-xs uppercase text-gray-400 mb-1">Problems</div>
            <div className="text-2xl font-bold">{stats.problems ?? stats.totalProblems ?? '—'}</div>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="text-xs uppercase text-gray-400 mb-1">Submissions</div>
            <div className="text-2xl font-bold">{stats.submissions ?? stats.totalSubmissions ?? '—'}</div>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="text-xs uppercase text-gray-400 mb-1">AI tokens (today)</div>
            <div className="text-2xl font-bold">{stats.aiTokensToday ?? '—'}</div>
          </div>
        </section>
      ) : null}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Users</h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <label htmlFor="admin-user-search" className="sr-only">Search users</label>
            <input
              id="admin-user-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">XP</th>
                <th className="text-left p-2">Level</th>
                <th className="text-left p-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="p-2 font-medium">{u.name}</td>
                  <td className="p-2 text-gray-300">{u.email}</td>
                  <td className="p-2">
                    <label className="sr-only" htmlFor={`role-${u._id}`}>Role for {u.name}</label>
                    <select
                      id={`role-${u._id}`}
                      value={u.role || 'user'}
                      onChange={(e) => onRoleChange(u._id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="moderator">moderator</option>
                    </select>
                  </td>
                  <td className="p-2">{u.xp || 0}</td>
                  <td className="p-2">{u.level || 1}</td>
                  <td className="p-2 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No users match.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <h2 className="font-semibold flex items-center gap-2 mb-2"><FaTrophy /> Badges & Awards</h2>
        <p className="text-sm text-gray-400">
          Award badges from the gamification module. Use the API endpoint
          <code className="px-1 mx-1 bg-gray-800 rounded">POST /api/admin/badges/award</code>
          to grant a badge to a user.
        </p>
      </div>
    </div>
  )
}

export default AdminPage
