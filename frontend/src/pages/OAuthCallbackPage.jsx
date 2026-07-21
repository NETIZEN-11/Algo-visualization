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
