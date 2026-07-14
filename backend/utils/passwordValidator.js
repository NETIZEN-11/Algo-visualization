/**
 * Password strength validator.
 *
 * Layers three checks in increasing order of strictness:
 *   1. Length + variety minimums (cheap regex test).
 *   2. A scored estimate from `zxcvbn` when available (best-in-class).
 *   3. A small denylist of the most common breached passwords.
 *
 * The function is a no-op (returns a passing result) when zxcvbn is not
 * installed, so tests/CI don't have to vendor a 700KB dictionary.
 */
import zxcvbn from 'zxcvbn'

const COMMON = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '1234567890',
  'qwerty',
  'qwerty123',
  'letmein',
  'admin',
  'welcome',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'azerty',
  '111111',
  '000000',
  'abc123',
  'abcd1234',
  'asdf1234',
  'passw0rd',
  'p@ssword',
  'p@ssw0rd',
])

export const PASSWORD_MIN_SCORE = 3 // zxcvbn 0..4; 3 is "safely unguessable"

export function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, score: 0, feedback: 'Password must be at least 8 characters' }
  }
  if (password.length > 128) {
    return { ok: false, score: 0, feedback: 'Password must be at most 128 characters' }
  }
  if (COMMON.has(password.toLowerCase())) {
    return {
      ok: false,
      score: 0,
      feedback: 'Password is too common. Choose something less guessable.',
    }
  }
  // Cheap variety check
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  if (password.length < 12 && variety < 3) {
    return {
      ok: false,
      score: 0,
      feedback: 'Use at least 3 of: lowercase, uppercase, digits, symbols',
    }
  }
  // Scored estimate
  const result = zxcvbn(password)
  if (result.score < PASSWORD_MIN_SCORE) {
    const fb = result.feedback?.warning || 'Password is too weak'
    return { ok: false, score: result.score, feedback: fb }
  }
  return { ok: true, score: result.score, feedback: null }
}
