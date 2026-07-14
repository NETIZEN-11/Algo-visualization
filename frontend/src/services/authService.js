/**
 * Auth service.
 *
 * Token model:
 *   - The server issues a short-lived access token (15m) and a refresh
 *     token (30d). The refresh token is set as an httpOnly cookie, the
 *     access token is returned in the JSON body and also in a non-httpOnly
 *     cookie for backward compatibility.
 *   - `api.js` keeps the access token in memory and handles 401 refresh.
 *   - This service is the only thing the UI talks to about auth.
 */
import api, { setAccessToken, clearAccessToken } from './api'

export const authService = {
  /** Register a new user. */
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    if (data?.token) setAccessToken(data.token)
    return data
  },

  /** Log in. */
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data?.token) setAccessToken(data.token)
    return data
  },

  /** Force-refresh the access token using the httpOnly refresh cookie. */
  refresh: async () => {
    const { data } = await api.post('/auth/refresh', null)
    if (data?.token) setAccessToken(data.token)
    return data
  },

  /** Get current user profile (used to rehydrate the auth store). */
  getProfile: async () => {
    const { data } = await api.get('/auth/profile')
    return data
  },

  /** Update profile fields. */
  updateProfile: async (updates) => {
    const { data } = await api.put('/auth/profile', updates)
    return data
  },

  /** Change password (current + new). */
  changePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return data
  },

  /** Request a password-reset email. */
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  /** Reset the password using a token from the email. */
  resetPassword: async ({ token, newPassword }) => {
    const { data } = await api.post(`/auth/reset-password?token=${encodeURIComponent(token)}`, {
      newPassword,
    })
    return data
  },

  /** Verify an email using a token. */
  verifyEmail: async (token) => {
    const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    return data
  },

  /** Resend the verification email. */
  resendVerification: async () => {
    const { data } = await api.post('/auth/resend-verification')
    return data
  },

  /** Logout (revoke the current refresh token). */
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAccessToken()
    }
  },

  /** Logout every device (revoke all refresh tokens for this user). */
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      clearAccessToken()
    }
  },

  /** Delete the account and cascade. */
  deleteAccount: async ({ password } = {}) => {
    const { data } = await api.delete('/auth/account', { data: { password } })
    clearAccessToken()
    return data
  },
}

export default authService
