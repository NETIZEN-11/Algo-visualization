import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'
import { useReducedMotion } from '../hooks/useReducedMotion'
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter'

export default function ResetPasswordPage() {
  const reduceMotion = useReducedMotion()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link.')
  }, [token])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword({ token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-xl"
      >
        <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-slate-200 text-sm mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back to login
        </Link>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Choose a new password</h1>
        <p className="text-slate-400 text-sm mb-6">At least 8 characters, mixed case, a number, and a symbol.</p>

        {done ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Password updated.</p>
              <p className="text-sm text-emerald-300/80">Redirecting to login…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-1">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'pw-error' : undefined}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <PasswordStrengthMeter password={password} />

            <label htmlFor="confirm" className="block text-sm text-slate-300 mb-1 mt-4">Confirm new password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {error ? (
              <p id="pw-error" className="text-sm text-red-400 mt-2" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" aria-hidden="true" /> {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !token}
              className="mt-6 w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  )
}
