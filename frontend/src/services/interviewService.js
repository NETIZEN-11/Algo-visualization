import api from './api'

export const interviewService = {
  // Start a new interview session
  startInterview: async (difficulty) => {
    const response = await api.post('/interview/start', { difficulty })
    return response.data
  },

  // Submit answer to interview question
  submitAnswer: async (sessionId, answer) => {
    const response = await api.post(`/interview/${sessionId}/answer`, { answer })
    return response.data
  },

  // Get AI feedback on answer
  getFeedback: async (sessionId, questionId) => {
    const response = await api.get(`/interview/${sessionId}/feedback/${questionId}`)
    return response.data
  },

  // End interview session
  endInterview: async (sessionId) => {
    const response = await api.post(`/interview/${sessionId}/end`)
    return response.data
  },

  // Get interview history
  getHistory: async () => {
    const response = await api.get('/interview/history')
    return response.data
  },

  // Get interview statistics
  getStats: async () => {
    const response = await api.get('/interview/stats')
    return response.data
  },
}

export default interviewService
