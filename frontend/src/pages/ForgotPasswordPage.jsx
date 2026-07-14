import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function ForgotPasswordPage() {
  const reduceMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset email.')
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
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Reset your password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your email and we'll send a link to choose a new password.
        </p>

        {sent ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Check your inbox.</p>
              <p className="text-sm text-emerald-300/80">
                If an account exists for <span className="font-mono">{email}</span>, a reset link is on the way.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'email-error' : undefined}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {error ? (
              <p id="email-error" className="text-sm text-red-400 mt-2" role="alert">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  )
}
