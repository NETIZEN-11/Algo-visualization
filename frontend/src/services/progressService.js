import api from './api'

export const progressService = {
  // Get user progress dashboard
  getDashboard: async () => {
    const response = await api.get('/progress/dashboard')
    return response.data
  },

  // Get detailed statistics
  getStatistics: async () => {
    const response = await api.get('/progress/statistics')
    return response.data
  },

  // Get user badges
  getBadges: async () => {
    const response = await api.get('/progress/badges')
    return response.data
  },

  // Get daily streak
  getStreak: async () => {
    const response = await api.get('/progress/streak')
    return response.data
  },

  // Get leaderboard
  getLeaderboard: async (timeframe = 'all') => {
    const response = await api.get(`/progress/leaderboard?timeframe=${timeframe}`)
    return response.data
  },

  // Get user rank
  getUserRank: async () => {
    const response = await api.get('/progress/rank')
    return response.data
  },

  // Get activity heatmap data
  getActivityHeatmap: async (year) => {
    const response = await api.get(`/progress/heatmap?year=${year}`)
    return response.data
  },

  // Get interview readiness score
  getReadinessScore: async () => {
    const response = await api.get('/progress/readiness')
    return response.data
  },

  // Update XP
  updateXP: async (points, activity) => {
    const response = await api.post('/progress/xp', { points, activity })
    return response.data
  },
}

export default progressService
