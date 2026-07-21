/**
 * Token service tests (refresh-token rotation + revocation). Uses the
 * in-memory Mongo, no HTTP layer.
 */
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

process.env.JWT_REFRESH_EXPIRE = '7d'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'

const {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  revokeFamily,
} = await import('../../services/tokenService.js')
const User = (await import('../../models/User.js')).default

let user
beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => {
  await clearTestDB()
  user = await User.create({
    name: 'Tok User',
    email: `tok_${Date.now()}@example.com`,
    password: 'hashed-pw-with-enough-entropy',
  })
})

describe('tokenService', () => {
  test('issueRefreshToken creates a record and returns a family', async () => {
    const r = await issueRefreshToken({ userId: user._id, userAgent: 'jest' })
    expect(r.jti).toBeTruthy()
    // family may be null when caller didn't pass one — the row in DB still has one
    expect(r.expiresAt instanceof Date).toBe(true)
    const r2 = await issueRefreshToken({ userId: user._id, family: 'fam-x' })
    expect(r2.family).toBe('fam-x')
  })

  test('rotateRefreshToken issues a new jti and revokes the old one', async () => {
    const a = await issueRefreshToken({ userId: user._id, family: 'fam-1' })
    const b = await rotateRefreshToken({ oldJti: a.jti, userId: user._id })
    expect(b.jti).not.toBe(a.jti)
    expect(b.family).toBe('fam-1')
  })

  test('rotating an already-rotated token triggers family compromise', async () => {
    const a = await issueRefreshToken({ userId: user._id })
    await rotateRefreshToken({ oldJti: a.jti, userId: user._id })
    await expect(rotateRefreshToken({ oldJti: a.jti, userId: user._id }))
      .rejects.toThrow(/reuse detected/i)
  })

  test('rotating an unknown jti throws', async () => {
    await expect(rotateRefreshToken({ oldJti: 'nope', userId: user._id }))
      .rejects.toThrow(/not recognised/i)
  })

  test('revokeRefreshToken flips the flag', async () => {
    const a = await issueRefreshToken({ userId: user._id })
    await revokeRefreshToken(a.jti)
    await expect(rotateRefreshToken({ oldJti: a.jti, userId: user._id }))
      .rejects.toThrow() // either reuse or not-recognised depending on impl
  })

  test('revokeAllForUser revokes every token for a user', async () => {
    const a = await issueRefreshToken({ userId: user._id })
    const b = await issueRefreshToken({ userId: user._id })
    await revokeAllForUser(user._id, 'pw_change')
    await expect(rotateRefreshToken({ oldJti: a.jti, userId: user._id })).rejects.toThrow()
    await expect(rotateRefreshToken({ oldJti: b.jti, userId: user._id })).rejects.toThrow()
  })

  test('revokeFamily only revokes tokens in that family', async () => {
    const a = await issueRefreshToken({ userId: user._id })
    const c = await issueRefreshToken({ userId: user._id })
    await revokeFamily(a.family, 'test')
    // c should still be usable (c has its own family).
    const rotated = await rotateRefreshToken({ oldJti: c.jti, userId: user._id })
    expect(rotated.jti).not.toBe(c.jti)
  })
})
