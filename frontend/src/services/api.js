import axios from 'axios'

/**
 * Centralised HTTP client.
 *
 * Auth model:
 *   - Access token: short-lived (15m), sent via Authorization header
 *     for compatibility with existing endpoints; can also be set as
 *     an httpOnly cookie by the server for same-origin flows.
 *   - Refresh token: 30d, httpOnly cookie, never visible to JS.
 *   - CSRF: server issues an `XSRF-TOKEN` non-httpOnly cookie; we echo
 *     it back as `X-XSRF-TOKEN` for state-changing requests.
 *
 * Behaviour:
 *   - Reads in-memory access token from `useAuthStore` (no localStorage).
 *   - On 401, attempts a single /auth/refresh, then retries the original
 *     request once. On failure, dispatches `auth:logout` for the store.
 *   - On 403 from a state-changing method, treats it as a CSRF failure
 *     and retries once after reading the XSRF cookie.
 *   - Sends `withCredentials: true` so httpOnly cookies are sent on
 *     cross-origin dev (Vite :5173 → API :5000).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ------------------------------------------------------------------ */
/* In-memory token store (no localStorage!)                            */
/* ------------------------------------------------------------------ */
let accessToken = null
let refreshInFlight = null
let onUnauthorized = null
let onLoginFromRefresh = null
let refreshAttemptCount = 0
let lastRefreshAttempt = 0

export const setAccessToken = (token) => {
  accessToken = token
  // Reset refresh attempt counter on successful token set
  refreshAttemptCount = 0
}
export const getAccessToken = () => accessToken
export const clearAccessToken = () => {
  accessToken = null
  refreshAttemptCount = 0
}

/** The auth store registers callbacks to react to refresh outcomes. */
export const registerAuthHandlers = ({ onLogout, onLogin }) => {
  onUnauthorized = onLogout
  onLoginFromRefresh = onLogin
}

/* ------------------------------------------------------------------ */
/* CSRF                                                                 */
/* ------------------------------------------------------------------ */
const readCookie = (name) => {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + escaped + '=([^;]*)'))
  return m ? decodeURIComponent(m[2]) : null
}

/* ------------------------------------------------------------------ */
/* Request interceptor                                                  */
/* ------------------------------------------------------------------ */
api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    // Attach CSRF for state-changing methods
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

/* ------------------------------------------------------------------ */
/* Response interceptor — refresh + CSRF retry                          */
/* ------------------------------------------------------------------ */
const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password') ||
  url.includes('/auth/logout') ||
  url.includes('/auth/logout-all') ||
  url.includes('/auth/account')


// Circuit breaker state
let circuitBreakerOpen = false
let circuitBreakerOpenedAt = 0

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    const status = error.response?.status
    const url = original.url || ''

    // CIRCUIT BREAKER: If we've hit the breaker, reject immediately for 10 seconds
    const now = Date.now()
    if (circuitBreakerOpen) {
      if (now - circuitBreakerOpenedAt < 10000) {
        // Still in cooldown period
        return Promise.reject(error)
      } else {
        // Cooldown expired, close the breaker
        circuitBreakerOpen = false
        refreshAttemptCount = 0
      }
    }

    // Never retry auth endpoints — they have their own flows
    if (isAuthEndpoint(url)) {
      return Promise.reject(error)
    }

    // CSRF failure on a state-changing method — retry once
    if (
      status === 403 &&
      ['post', 'put', 'patch', 'delete'].includes((original.method || 'get').toLowerCase()) &&
      !original.__csrfRetried
    ) {
      original.__csrfRetried = true
      return api(original)
    }

    // Access token expired — refresh and retry once
    if (status === 401 && !original.__retried) {
      // Prevent infinite refresh loops
      const now = Date.now()
      const timeSinceLastAttempt = now - lastRefreshAttempt
      
      // If we've tried refreshing 3+ times in the last 5 seconds, OPEN CIRCUIT BREAKER
      if (refreshAttemptCount >= 3 && timeSinceLastAttempt < 5000) {
        console.warn('🚨 Auth circuit breaker triggered - too many refresh attempts')
        circuitBreakerOpen = true
        circuitBreakerOpenedAt = now
        clearAccessToken()
        onUnauthorized?.()
        return Promise.reject(error)
      }
      
      // Reset counter if enough time has passed
      if (timeSinceLastAttempt > 5000) {
        refreshAttemptCount = 0
      }
      
      original.__retried = true
      lastRefreshAttempt = now
      refreshAttemptCount++
      
      try {
        if (!refreshInFlight) {
          refreshInFlight = axios
            .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
            .then((r) => r.data)
            .finally(() => {
              refreshInFlight = null
            })
        }
        const data = await refreshInFlight
        if (data?.token) {
          setAccessToken(data.token)
          onLoginFromRefresh?.(data.user || null, data.token)
          refreshAttemptCount = 0 // Success, reset counter
        } else if (data?.accessToken) {
          setAccessToken(data.accessToken)
          refreshAttemptCount = 0 // Success, reset counter
        }
        original.headers = original.headers || {}
        if (accessToken) original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshErr) {
        // Refresh failed — if this is the 3rd failure, open circuit breaker
        if (refreshAttemptCount >= 3) {
          console.warn('🚨 Auth circuit breaker triggered - refresh failed 3 times')
          circuitBreakerOpen = true
          circuitBreakerOpenedAt = Date.now()
        }
        // Log the user out cleanly
        clearAccessToken()
        onUnauthorized?.()
        return Promise.reject(refreshErr)
      }
    }

    // For any other 401 on a public page, don't bounce — let the page handle it
    return Promise.reject(error)
  }
)

export default api
