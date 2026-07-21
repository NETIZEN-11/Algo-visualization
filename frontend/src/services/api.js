import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export { API_BASE_URL }

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken = null
let refreshInFlight = null
let onUnauthorized = null
let onLoginFromRefresh = null
let refreshAttemptCount = 0
let lastRefreshAttempt = 0

export const setAccessToken = (token) => {
  accessToken = token

  refreshAttemptCount = 0
}
export const getAccessToken = () => accessToken
export const clearAccessToken = () => {
  accessToken = null
  refreshAttemptCount = 0
}

export const registerAuthHandlers = ({ onLogout, onLogin }) => {
  onUnauthorized = onLogout
  onLoginFromRefresh = onLogin
}

const readCookie = (name) => {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + escaped + '=([^;]*)'))
  return m ? decodeURIComponent(m[2]) : null
}

api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    const method = (config.method || 'get').toLowerCase()
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrf = readCookie('XSRF-TOKEN')
      if (csrf) {
        config.headers['X-XSRF-TOKEN'] = csrf
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password') ||
  url.includes('/auth/logout') ||
  url.includes('/auth/logout-all') ||
  url.includes('/auth/account')

let circuitBreakerOpen = false
let circuitBreakerOpenedAt = 0

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    const status = error.response?.status
    const url = original.url || ''

    const now = Date.now()
    if (circuitBreakerOpen) {
      if (now - circuitBreakerOpenedAt < 10000) {

        return Promise.reject(error)
      } else {

        circuitBreakerOpen = false
        refreshAttemptCount = 0
      }
    }

    if (isAuthEndpoint(url)) {
      return Promise.reject(error)
    }

    if (
      status === 403 &&
      ['post', 'put', 'patch', 'delete'].includes((original.method || 'get').toLowerCase()) &&
      !original.__csrfRetried
    ) {
      original.__csrfRetried = true
      return api(original)
    }

    if (status === 401 && !original.__retried) {

      const now = Date.now()
      const timeSinceLastAttempt = now - lastRefreshAttempt

      if (refreshAttemptCount >= 3 && timeSinceLastAttempt < 5000) {
        console.warn('🚨 Auth circuit breaker triggered - too many refresh attempts')
        circuitBreakerOpen = true
        circuitBreakerOpenedAt = now
        clearAccessToken()
        onUnauthorized?.()
        return Promise.reject(error)
      }

      if (timeSinceLastAttempt > 5000) {
        refreshAttemptCount = 0
      }

      original.__retried = true
      lastRefreshAttempt = now
      refreshAttemptCount++

      try {
        if (!refreshInFlight) {

          refreshInFlight = api
            .post('/auth/refresh', null)
            .then((r) => r.data)
            .finally(() => {
              refreshInFlight = null
            })
        }
        const data = await refreshInFlight
        if (data?.accessToken) {
          setAccessToken(data.accessToken)
          onLoginFromRefresh?.(data.user || null, data.accessToken)
          refreshAttemptCount = 0
        }
        original.headers = original.headers || {}
        if (accessToken) original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshErr) {

        if (refreshAttemptCount >= 3) {
          console.warn('🚨 Auth circuit breaker triggered - refresh failed 3 times')
          circuitBreakerOpen = true
          circuitBreakerOpenedAt = Date.now()
        }

        clearAccessToken()
        onUnauthorized?.()
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

export default api
