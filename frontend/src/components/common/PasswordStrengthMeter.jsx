import { useMemo } from 'react'
import { validatePasswordStrength } from '../../utils/password'

/**
 * Visual strength meter for new-password fields.
 *
 * Props:
 *   password — current value
 *   userInputs — array of strings to penalise (e.g. name/email)
 */
const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent']
const STRENGTH_COLOURS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-emerald-500',
  'bg-emerald-400',
]

export default function PasswordStrengthMeter({ password = '', userInputs = [] }) {
  const { score, feedback } = useMemo(
    () => validatePasswordStrength(password, userInputs),
    [password, userInputs]
  )
  const safeScore = Math.max(0, Math.min(4, score))
  const widthPct = ((safeScore + 1) / 5) * 100

  return (
    <div className="mt-1" aria-live="polite">
      <div
        className="h-2 w-full rounded bg-slate-700 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(widthPct)}
        aria-label="Password strength"
      >
        <div
          className={`h-full transition-all ${STRENGTH_COLOURS[safeScore]}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-400">
        <span>{STRENGTH_LABELS[safeScore]}</span>
        {feedback?.warning ? <span>{feedback.warning}</span> : null}
      </div>
      {feedback?.suggestions?.length ? (
        <ul className="mt-1 text-xs text-slate-500 list-disc pl-4">
          {feedback.suggestions.slice(0, 2).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
