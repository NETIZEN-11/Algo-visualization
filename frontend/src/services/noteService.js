import api from './api'

export const noteService = {
  list: async (params = {}) => {
    const { data } = await api.get('/notes', { params })
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/notes/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/notes', payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/notes/${id}`, payload)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/notes/${id}`)
    return data
  },
  togglePin: async (id) => {
    const { data } = await api.post(`/notes/${id}/pin`)
    return data
  },
}

export default noteService
