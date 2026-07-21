import api from './api'

export const interviewService = {

  startInterview: async (difficulty) => {
    const response = await api.post('/interview/start', { difficulty })
    return response.data
  },

  submitAnswer: async (sessionId, answer) => {
    const response = await api.post(`/interview/${sessionId}/answer`, { answer })
    return response.data
  },

  getFeedback: async (sessionId, questionId) => {
    const response = await api.get(`/interview/${sessionId}/feedback/${questionId}`)
    return response.data
  },

  endInterview: async (sessionId) => {
    const response = await api.post(`/interview/${sessionId}/end`)
    return response.data
  },

  getHistory: async () => {
    const response = await api.get('/interview/history')
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/interview/stats')
    return response.data
  },
}

export default interviewService
