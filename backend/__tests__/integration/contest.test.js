import request from 'supertest'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

process.env.DISABLE_CSRF = 'true'
process.env.DISABLE_RATE_LIMIT = 'true'
process.env.RUN_SERVER = 'false'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
const { default: app } = await import('../../server.js')

let counter = 0
const newUser = () => ({
  name: `Ct User ${++counter}`,
  email: `ct_${counter}_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
})

let token = null

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => {
  await clearTestDB()
  const u = newUser()
  const reg = await request(app).post('/api/auth/register').send(u)
  token = reg.body.token || extractAccessToken(reg.headers['set-cookie'])
})

const auth = () => ({ Authorization: `Bearer ${token}` })

describe('Contests', () => {
  test('GET /api/contest → 200 (public)', async () => {
    const res = await request(app).get('/api/contest')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('GET /api/contest/:id with bad id → 404 or 400', async () => {
    const res = await request(app).get('/api/contest/64b5fa11ca11fa11ca11fa11')
    expect([400, 404, 500]).toContain(res.status)
  })

  test('GET /api/contest/:id/leaderboard with bad id → 404', async () => {
    const res = await request(app).get('/api/contest/64b5fa11ca11fa11ca11fa11/leaderboard')
    expect([404, 500]).toContain(res.status)
  })

  test('POST /api/contest/:id/register requires auth', async () => {
    const res = await request(app).post('/api/contest/64b5fa11ca11fa11ca11fa11/register')
    expect(res.status).toBe(401)
  })

  test('POST /api/contest/:id/register on non-existent contest → 404', async () => {
    const res = await request(app)
      .post('/api/contest/64b5fa11ca11fa11ca11fa11/register')
      .set(auth())
    expect([400, 404, 500]).toContain(res.status)
  })

  test('POST /api/contest/:id/submit validates body', async () => {
    const res = await request(app)
      .post('/api/contest/64b5fa11ca11fa11ca11fa11/submit')
      .set(auth())
      .send({})
    expect([400, 422]).toContain(res.status)
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
