process.env.NODE_ENV = 'test'
process.env.SMTP_HOST = ''
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'

import {
  sendEmail,
  buildVerificationEmail,
  buildPasswordResetEmail,
  isEmailEnabled,
} from '../../services/emailService.js'

describe('emailService', () => {
  test('isEmailEnabled is false without SMTP_HOST', () => {
    expect(isEmailEnabled()).toBe(false)
  })

  test('sendEmail in dev mode returns delivered:false and does not throw', async () => {
    const r = await sendEmail({ to: 'user@example.com', subject: 'Hi', text: 'hello' })
    expect(r.delivered).toBe(false)
    expect(r.dev).toBe(true)
  })

  test('buildVerificationEmail escapes name and link', () => {
    const e = buildVerificationEmail({ name: '<script>x</script>', verifyUrl: 'https://x?a=1&b=2' })
    expect(e.subject).toMatch(/Verify/)
    expect(e.html).not.toContain('<script>x</script>')
    expect(e.html).toContain('&lt;script&gt;')
    expect(e.text).toContain('https://x?a=1&b=2')
  })

  test('buildPasswordResetEmail renders subject and link', () => {
    const e = buildPasswordResetEmail({ name: 'Alice', resetUrl: 'https://x/r?token=abc' })
    expect(e.subject).toMatch(/Reset/)
    expect(e.html).toContain('Alice')
    expect(e.text).toContain('https://x/r?token=abc')
  })
})
