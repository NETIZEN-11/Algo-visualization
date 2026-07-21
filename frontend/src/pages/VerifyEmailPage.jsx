import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { authService } from '../services/authService'
import useAuthStore from '../store/useAuthStore'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function VerifyEmailPage() {
  const reduceMotion = useReducedMotion()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const token = params.get('token') || ''

  const [state, setState] = useState(token ? 'verifying' : 'idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await authService.verifyEmail(token)
        if (cancelled) return
        if (data?.user) updateUser({ emailVerified: true })
        setState('verified')
        setTimeout(() => navigate('/'), 1500)
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || 'Could not verify email.')
        setState('error')
      }
    })()
    return () => { cancelled = true }

  }, [token])

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Verify your email</h1>

        {state === 'idle' && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Click the link in the email we sent you. If you didn't get one, request a new one.
            </p>
            <button
              onClick={async () => {
                setState('sending')
                try { await authService.resendVerification(); setState('sent') }
                catch (e) { setError(e.response?.data?.message || 'Could not resend.'); setState('error') }
              }}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold"
            >
              Resend verification email
            </button>
            {state === 'sent' && <p className="text-emerald-400 text-sm">Sent — check your inbox.</p>}
          </div>
        )}

        {state === 'verifying' && (
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Verifying…
          </div>
        )}

        {state === 'verified' && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Email verified.</p>
              <p className="text-sm text-emerald-300/80">Redirecting…</p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-200">
              <AlertCircle className="h-5 w-5 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
            <Link to="/login" className="text-sky-400 hover:underline text-sm">Back to login</Link>
          </div>
        )}
      </motion.div>
    </main>
  )
}
