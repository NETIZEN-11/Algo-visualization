import { create } from 'zustand'
import api from '../services/api'

const CACHE_TTL_MS = 60_000

let cache = {
  userId: null,
  fetchedAt: 0,
  analytics: null,
  readiness: null,
  topics: null,
}

const isFresh = (userId) =>
  cache.userId === userId && Date.now() - cache.fetchedAt < CACHE_TTL_MS

const useProgressStore = create((set) => ({
  analytics: null,
  readinessScore: null,
  topicAnalysis: null,
  isLoading: false,
  error: null,

  getAnalytics: async (userId) => {
    if (isFresh(userId) && cache.analytics) {
      set({ analytics: cache.analytics })
      return { success: true, data: cache.analytics }
    }
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/analytics')
      cache = { ...cache, analytics: response.data.data, userId, fetchedAt: Date.now() }
      set({ analytics: response.data.data, isLoading: false })
      return { success: true, data: response.data.data }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch analytics',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  getReadinessScore: async (userId) => {
    if (isFresh(userId) && cache.readiness) {
      set({ readinessScore: cache.readiness })
      return { success: true, data: cache.readiness }
    }
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/analytics/interview-readiness')
      cache = { ...cache, readiness: response.data.data, userId, fetchedAt: Date.now() }
      set({ readinessScore: response.data.data, isLoading: false })
      return { success: true, data: response.data.data }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to calculate readiness',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  getTopicAnalysis: async (userId) => {
    if (isFresh(userId) && cache.topics) {
      set({ topicAnalysis: cache.topics })
      return { success: true, data: cache.topics }
    }
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/analytics/topics')
      cache = { ...cache, topics: response.data.data, userId, fetchedAt: Date.now() }
      set({ topicAnalysis: response.data.data, isLoading: false })
      return { success: true, data: response.data.data }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch topic analysis',
        isLoading: false,
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  reset: () => {
    cache = { userId: null, fetchedAt: 0, analytics: null, readiness: null, topics: null }
    set({ analytics: null, readinessScore: null, topicAnalysis: null, error: null })
  },

  clearError: () => set({ error: null }),
}))

export default useProgressStore
