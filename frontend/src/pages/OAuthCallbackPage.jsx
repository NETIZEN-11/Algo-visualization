/**
 * OAuth callback landing page.
 *
 * The backend redirects the user here after a successful provider
 * handshake. The access token arrives in the URL as `?accessToken=…`.
 * We:
 *   1. Read the token (and optional error) from the URL.
 *   2. Hand the token to the in-memory store via `setAccessToken`.
 *   3. Fetch the user profile and populate the auth store.
 *   4. Strip the token from the URL with `history.replaceState` so it
 *      doesn't end up in browser history / logs / referrers.
 *   5. Navigate to `/`.
 *
 * If the URL contains an `error` param, we just send the user back to
 * `/login` with a toast.
 */
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAccessToken } from '../services/api'
import { authService } from '../services/authService'
import useAuthStore from '../store/useAuthStore'
import toast from 'react-hot-toast'

function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth)
  // Avoid running the effect twice in React 18 strict mode.
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const error = params.get('error')
    if (error) {
      toast.error(`Sign-in failed: ${decodeURIComponent(error)}`)
      navigate('/login', { replace: true })
      return
    }

    const accessToken = params.get('accessToken')
    const provider = params.get('provider')
    if (!accessToken) {
      toast.error('OAuth callback is missing the access token')
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setAccessToken(accessToken)
        const data = await authService.getProfile()
        if (cancelled) return
        if (data?.user) {
          loginWithOAuth(data.user)
        }
        // Strip the token from the URL before the user has a chance to
        // copy/paste it. Use replaceState so back-button doesn't put
        // the token back in the bar.
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        const label = provider ? `Signed in with ${provider[0].toUpperCase()}${provider.slice(1)}` : 'Welcome!'
        toast.success(label)
        navigate('/', { replace: true })
      } catch (e) {
        if (cancelled) return
        toast.error(e.response?.data?.message || 'Failed to complete sign-in')
        navigate('/login', { replace: true })
      }
    })()

    return () => { cancelled = true }
  }, [params, navigate, loginWithOAuth])

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0B1120]"
      role="status"
      aria-live="polite"
      aria-label="Completing sign-in"
    >
      <div className="text-center">
        <div
          className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-gray-400">Completing sign-in…</p>
      </div>
    </div>
  )
}

export default OAuthCallbackPage
