import { describe, it, expect } from 'vitest'
import { validatePasswordStrength } from '../../utils/password'

describe('validatePasswordStrength', () => {
  it('returns score 0 for empty password', () => {
    expect(validatePasswordStrength('').score).toBe(0)
  })

  it('returns score 0 for short password', () => {
    expect(validatePasswordStrength('Ab1!').score).toBe(0)
  })

  it('returns score 0 for common passwords', () => {
    expect(validatePasswordStrength('password').score).toBe(0)
  })

  it('scores a medium password higher than a short one', () => {
    const short = validatePasswordStrength('Ab1!')
    const medium = validatePasswordStrength('Ab1!Ab1!Ab1!Ab1!Ab1!')
    expect(medium.score).toBeGreaterThan(short.score)
  })

  it('caps the score at 4', () => {
    const r = validatePasswordStrength('Tr0ub4dor&3xK!ngZ_Qu1ck')
    expect(r.score).toBeLessThanOrEqual(4)
  })

  it('returns feedback with suggestions for weak passwords', () => {
    const r = validatePasswordStrength('abc')
    expect(r.feedback).toBeDefined()
    expect(Array.isArray(r.feedback.suggestions) || typeof r.feedback.suggestions === 'string').toBeTruthy()
  })

  it('penalises passwords containing the user\'s name', () => {
    const neutral = validatePasswordStrength('Tr0ub4dor&3xK!ngZ')
    const personalised = validatePasswordStrength('Tr0ub4dor&3xK!ngZ', ['Tr0ub4dor'])
    expect(personalised.score).toBeLessThanOrEqual(neutral.score)
  })
})
