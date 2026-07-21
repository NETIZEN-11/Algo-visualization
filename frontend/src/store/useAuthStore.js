import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken, clearAccessToken, registerAuthHandlers } from '../services/api'
import { authService } from '../services/authService'

/**
 * Auth store — *no tokens in localStorage*.
 *
 *  - User object is persisted to localStorage for fast rehydration
 *    (display name, theme, etc.) but the access token lives only in
 *    memory in `api.js`.
 *  - On page refresh, we re-validate by calling `/auth/profile` once.
 *    The refresh token rides along as an httpOnly cookie so the call
 *    succeeds if the user is still "logged in" (the API will refresh
 *    the access token and rehydrate us).
 *  - `api.js` calls back into us on 401-refresh-fail to clear state.
 */

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rehydrated: false,

      /* ----- session bootstrap ----- */
      rehydrate: async () => {
        if (get().rehydrated) return
        set({ isLoading: true, rehydrated: true })
        try {
          // /auth/profile will trigger a 401 → /auth/refresh → 200 cycle
          // via the api interceptor. If refresh also fails, the store
          // is cleared by the unauthorised handler.
          const data = await authService.getProfile()
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch {
          // Failed to rehydrate — clear tokens and state. Keep
          // `rehydrated: true` so we don't loop on every render.
          clearAccessToken()
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            rehydrated: true,
          })
        }
      },

      /* ----- auth flows ----- */
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

      logout: async () => {
        if (get().isAuthenticated) {
          try { await authService.logout() } catch { /* ignore */ }
        }
        clearAccessToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      logoutAll: async () => {
        if (get().isAuthenticated) {
          try { await authService.logoutAll() } catch { /* ignore */ }
        }
        clearAccessToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      deleteAccount: async (password) => {
        if (get().isAuthenticated) {
          try { await authService.deleteAccount({ password }) } catch { /* swallow */ }
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
      // Persist only the *user*, never the token.
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Wire the api refresh callbacks to the store so a 401-fail resets
// authentication state cleanly. This is module-scope so it runs once
// at import time.
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
