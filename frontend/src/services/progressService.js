import api from './api'

export const progressService = {

  getDashboard: async () => {
    const response = await api.get('/progress/dashboard')
    return response.data
  },

  getStatistics: async () => {
    const response = await api.get('/progress/statistics')
    return response.data
  },

  getBadges: async () => {
    const response = await api.get('/progress/badges')
    return response.data
  },

  getStreak: async () => {
    const response = await api.get('/progress/streak')
    return response.data
  },

  getLeaderboard: async (timeframe = 'all') => {
    const response = await api.get(`/progress/leaderboard?timeframe=${timeframe}`)
    return response.data
  },

  getUserRank: async () => {
    const response = await api.get('/progress/rank')
    return response.data
  },

  getActivityHeatmap: async (year) => {
    const response = await api.get(`/progress/heatmap?year=${year}`)
    return response.data
  },

  getReadinessScore: async () => {
    const response = await api.get('/progress/readiness')
    return response.data
  },

  updateXP: async (points, activity) => {
    const response = await api.post('/progress/xp', { points, activity })
    return response.data
  },
}

export default progressService
