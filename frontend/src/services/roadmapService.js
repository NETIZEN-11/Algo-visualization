import api from './api'

/**
 * Per-user roadmap service.
 */
export const roadmapService = {
  get: async () => {
    const { data } = await api.get('/roadmap')
    return data
  },
  updateProgress: async ({ topicId, completed, problemsSolved, notes }) => {
    const { data } = await api.put('/roadmap/progress', { topicId, completed, problemsSolved, notes })
    return data
  },
  reset: async () => {
    const { data } = await api.post('/roadmap/reset')
    return data
  },
}

export default roadmapService
