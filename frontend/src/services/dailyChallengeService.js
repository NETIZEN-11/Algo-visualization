import api from './api'

/**
 * Daily-challenge service.
 */
export const dailyChallengeService = {
  today: async () => {
    const { data } = await api.get('/gamification/daily-challenge')
    return data
  },
  complete: async (payload) => {
    const { data } = await api.post('/gamification/daily-challenge/complete', payload)
    return data
  },
  streak: async () => {
    const { data } = await api.get('/gamification/streak')
    return data
  },
  leaderboard: async (params = {}) => {
    const { data } = await api.get('/gamification/leaderboard', { params })
    return data
  },
  level: async () => {
    const { data } = await api.get('/gamification/level')
    return data
  },
}

export default dailyChallengeService
