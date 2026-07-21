import api from './api'

export const contestService = {
  list: async (params = {}) => {
    const { data } = await api.get('/contest', { params })
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/contest/${id}`)
    return data
  },
  register: async (id) => {
    const { data } = await api.post(`/contest/${id}/register`)
    return data
  },
  submit: async (id, payload) => {
    const { data } = await api.post(`/contest/${id}/submit`, payload)
    return data
  },
  leaderboard: async (id, params = {}) => {
    const { data } = await api.get(`/contest/${id}/leaderboard`, { params })
    return data
  },
}

export default contestService
