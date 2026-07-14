/**
 * Unit tests for `utils/passwordValidator.js` — zxcvbn scoring with a
 * common-password denylist.
 */
import { validatePasswordStrength } from '../../utils/passwordValidator.js'

describe('passwordValidator', () => {
  test('strong password → ok=true', () => {
    const r = validatePasswordStrength('Tr0ub4dor&3xtra-Long-Pass!')
    expect(r.ok).toBe(true)
    expect(r.score).toBeGreaterThanOrEqual(3)
  })

  test('short password → ok=false', () => {
    const r = validatePasswordStrength('abc')
    expect(r.ok).toBe(false)
  })

  test('common password → ok=false even if it has length', () => {
    const r = validatePasswordStrength('password1234')
    expect(r.ok).toBe(false)
  })

  test('all-digits long password → ok=false (low entropy)', () => {
    const r = validatePasswordStrength('12345678901234567890')
    expect(r.ok).toBe(false)
  })

  test('returns a feedback string on weak', () => {
    const r = validatePasswordStrength('short')
    expect(r.ok).toBe(false)
    expect(typeof r.feedback).toBe('string')
    expect(r.feedback.length).toBeGreaterThan(0)
  })
})
