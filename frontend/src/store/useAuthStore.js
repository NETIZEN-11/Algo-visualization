import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken, clearAccessToken, registerAuthHandlers } from '../services/api'
import { authService } from '../services/authService'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rehydrated: false,

      rehydrate: async () => {
        if (get().rehydrated) return
        set({ isLoading: true, rehydrated: true })
        try {

          const data = await authService.getProfile()
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch {
          // Profile fetch failed - user not authenticated
          clearAccessToken()
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            rehydrated: true,
          })
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.login({ email, password })
          if (data?.accessToken) setAccessToken(data.accessToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({
            error: err.response?.data?.message || 'Login failed',
            isLoading: false,
          })
          return { success: false, error: err.response?.data?.message }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.register({ name, email, password })
          if (data?.accessToken) setAccessToken(data.accessToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({
            error: err.response?.data?.message || 'Registration failed',
            isLoading: false,
          })
          return { success: false, error: err.response?.data?.message }
        }
      },

      loginWithOAuth: (user) => {
        set({ user, isAuthenticated: true, error: null, isLoading: false })
      },

      logout: async () => {
        if (get().isAuthenticated) {
          try { await authService.logout() } catch { /* ignore logout errors */ }
        }
        clearAccessToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      logoutAll: async () => {
        if (get().isAuthenticated) {
          try { await authService.logoutAll() } catch { /* ignore logout errors */ }
        }
        clearAccessToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      deleteAccount: async (password) => {
        if (get().isAuthenticated) {
          try { await authService.deleteAccount({ password }) } catch { /* ignore errors */ }
        }
        clearAccessToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      updateUser: (userData) =>
        set((state) => ({ user: { ...(state.user || {}), ...userData } })),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',

      partialize: (state) => ({ user: state.user }),
    }
  )
)

registerAuthHandlers({
  onLogout: () => {
    try { useAuthStore.getState().logout() } catch { /* ignore */ }
  },
  onLogin: (user, token) => {
    if (user) useAuthStore.setState({ user, isAuthenticated: true })
    if (token) setAccessToken(token)
  },
})

export default useAuthStore
