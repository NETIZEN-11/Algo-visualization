import { create } from 'zustand'
import api from '../services/api'

const useProblemStore = create((set) => ({
  currentProblem: null,
  problems: [],
  isLoading: false,
  error: null,

  scrapeProblem: async (url) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/problems/scrape', { url })
      set({ isLoading: false })
      return { success: true, data: response.data.data }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to scrape problem',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  analyzeProblem: async (problemData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/problems/analyze', {
        problemData,
      })
      set({
        currentProblem: response.data.data,
        isLoading: false,
      })
      return { success: true, data: response.data.data, problemId: response.data.problemId }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to analyze problem',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  getProblem: async (problemId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/problems/${problemId}`)
      set({
        currentProblem: response.data.problem,
        isLoading: false,
      })
      return { success: true, data: response.data.problem }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch problem',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  getUserProblems: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/problems/user')
      set({
        problems: response.data.problems,
        isLoading: false,
      })
      return { success: true, data: response.data.problems }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch problems',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  clearCurrentProblem: () => set({ currentProblem: null }),

  clearError: () => set({ error: null }),
}))

export default useProblemStore
