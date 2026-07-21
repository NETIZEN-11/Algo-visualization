import api, { setAccessToken, clearAccessToken, API_BASE_URL } from './api'

export const authService = {

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    if (data?.accessToken) setAccessToken(data.accessToken)
    return data
  },

  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data?.accessToken) setAccessToken(data.accessToken)
    return data
  },

  refresh: async () => {
    const { data } = await api.post('/auth/refresh', null)
    if (data?.accessToken) setAccessToken(data.accessToken)
    return data
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile')
    return data
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/auth/profile', updates)
    return data
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return data
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async ({ token, newPassword }) => {
    const { data } = await api.post(`/auth/reset-password?token=${encodeURIComponent(token)}`, {
      newPassword,
    })
    return data
  },

  verifyEmail: async (token) => {
    const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    return data
  },

  resendVerification: async () => {
    const { data } = await api.post('/auth/resend-verification')
    return data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAccessToken()
    }
  },

  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      clearAccessToken()
    }
  },

  deleteAccount: async ({ password } = {}) => {
    const { data } = await api.delete('/auth/account', { data: { password } })
    clearAccessToken()
    return data
  },

  oauthStart: (provider) => {
    const base = API_BASE_URL.replace(/\/$/, '')
    return `${base}/auth/oauth/${provider}/start`
  },
}

export default authService
