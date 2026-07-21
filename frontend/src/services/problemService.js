import api from './api'

export const problemService = {

  analyzeProblem: async (problemData) => {

    const response = await api.post('/problems/analyze', { problemData })
    return response.data
  },

  getProblem: async (id) => {
    const response = await api.get(`/problems/${id}`)
    return response.data
  },

  getUserProblems: async () => {
    const response = await api.get('/problems/user')
    return response.data
  },

  saveProblem: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/save`)
    return response.data
  },

  unsaveProblem: async (problemId) => {
    const response = await api.delete(`/problems/${problemId}/save`)
    return response.data
  },

  markSolved: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/solve`)
    return response.data
  },

  getVisualization: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/visualization`)
    return response.data
  },

  getCodeSolutions: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/solutions`)
    return response.data
  },

  getHints: async (problemId, level, problemData) => {

    const response = await api.post(`/problems/${problemId}/hints`, {
      hintLevel: level,
      problemData,
    })
    return response.data
  },

  analyzeCode: async (code, language, problemId) => {
    const response = await api.post('/problems/analyze-code', {
      code,
      language,
      problemId,
    })
    return response.data
  },

  generateTestCases: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/test-cases`)
    return response.data
  },

  executeDryRun: async (problemId, { code, customInput, language = 'python' }) => {
    const response = await api.post(`/problems/${problemId}/dry-run`, {
      code,
      customInput,
      language,
    })
    return response.data
  },

  getRelatedProblems: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/related`)
    return response.data
  },

  searchByCompany: async (company) => {
    const response = await api.get(`/problems/company/${company}`)
    return response.data
  },

  getByPattern: async (pattern) => {
    const response = await api.get(`/problems/pattern/${pattern}`)
    return response.data
  },
}

export default problemService
