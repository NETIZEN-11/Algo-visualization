import api from './api'

export const problemService = {
  // Analyze a problem from URL or text
  analyzeProblem: async (problemData) => {
    // Backend expects { problemData: { title, description, ... } }
    const response = await api.post('/problems/analyze', { problemData })
    return response.data
  },

  // Get problem by ID
  getProblem: async (id) => {
    const response = await api.get(`/problems/${id}`)
    return response.data
  },

  // Get all user's analyzed problems
  getUserProblems: async () => {
    const response = await api.get('/problems/user')
    return response.data
  },

  // Save problem for later
  saveProblem: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/save`)
    return response.data
  },

  // Remove problem from saved list
  unsaveProblem: async (problemId) => {
    const response = await api.delete(`/problems/${problemId}/save`)
    return response.data
  },

  // Mark problem as solved
  markSolved: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/solve`)
    return response.data
  },

  // Get visualization data
  getVisualization: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/visualization`)
    return response.data
  },

  // Get code solutions
  getCodeSolutions: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/solutions`)
    return response.data
  },

  // Get hints
  getHints: async (problemId, level, problemData) => {
    // Backend reads `req.params.id` (problemId) and `req.body.{hintLevel, problemData}`
    const response = await api.post(`/problems/${problemId}/hints`, {
      hintLevel: level,
      problemData,
    })
    return response.data
  },

  // Analyze user code for bugs
  analyzeCode: async (code, language, problemId) => {
    const response = await api.post('/problems/analyze-code', {
      code,
      language,
      problemId,
    })
    return response.data
  },

  // Generate test cases
  generateTestCases: async (problemId) => {
    const response = await api.post(`/problems/${problemId}/test-cases`)
    return response.data
  },

  // Execute dry run.
  // Backend signature: POST /:id/dry-run, body = { code, customInput, language }
  executeDryRun: async (problemId, { code, customInput, language = 'python' }) => {
    const response = await api.post(`/problems/${problemId}/dry-run`, {
      code,
      customInput,
      language,
    })
    return response.data
  },

  // Get related problems
  getRelatedProblems: async (problemId) => {
    const response = await api.get(`/problems/${problemId}/related`)
    return response.data
  },

  // Search problems by company
  searchByCompany: async (company) => {
    const response = await api.get(`/problems/company/${company}`)
    return response.data
  },

  // Get problems by pattern
  getByPattern: async (pattern) => {
    const response = await api.get(`/problems/pattern/${pattern}`)
    return response.data
  },
}

export default problemService
