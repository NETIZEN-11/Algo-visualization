import api from './api'

/**
 * Admin service — gated by role === 'admin' on the backend.
 */
export const adminService = {
  listUsers: async (params = {}) => {
    const { data } = await api.get('/admin/users', { params })
    return data
  },
  updateUserRole: async (id, role) => {
    const { data } = await api.put(`/admin/users/${id}/role`, { role })
    return data
  },
  disableUser: async (id) => {
    const { data } = await api.put(`/admin/users/${id}/disable`)
    return data
  },
  enableUser: async (id) => {
    const { data } = await api.put(`/admin/users/${id}/enable`)
    return data
  },
  awardBadge: async ({ userId, badgeId }) => {
    const { data } = await api.post('/admin/badges/award', { userId, badgeId })
    return data
  },
  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },
}

export default adminService
