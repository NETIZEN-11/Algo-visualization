import api from './api'

/**
 * Submission service.
 */
export const submissionService = {
  list: async (params = {}) => {
    const { data } = await api.get('/submissions', { params })
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/submissions/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/submissions', payload)
    return data
  },
}

export default submissionService
