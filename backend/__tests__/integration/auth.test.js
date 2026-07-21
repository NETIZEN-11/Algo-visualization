/**
 * Integration tests for `/api/auth`.
 *
 * Uses mongodb-memory-server. Each test gets a fresh DB.
 */
import request from 'supertest'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

// The test disables CSRF via env; the server reads DISABLE_CSRF at
// boot. We import the app lazily so env is set first.
process.env.DISABLE_CSRF = 'true'
process.env.DISABLE_RATE_LIMIT = 'true'
process.env.RUN_SERVER = 'false'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
const { default: app } = await import('../../server.js')

let counter = 0
const newUser = (overrides = {}) => ({
  name: `Test User ${++counter}`,
  email: `test_${counter}_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
  ...overrides,
})

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => { await clearTestDB() })

describe('POST /api/auth/register', () => {
  test('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X Y', email: 'a@b.com', password: 'password' })
    expect([400, 422]).toContain(res.status)
    expect(res.body.success).toBe(false)
  })

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'a@b.com', password: 'TestPass!123Strong' })
    expect([400, 422]).toContain(res.status)
  })

  test('rejects duplicate email', async () => {
    const u = newUser()
    await request(app).post('/api/auth/register').send(u)
    const res = await request(app).post('/api/auth/register').send(u)
    expect([400, 409]).toContain(res.status)
  })

  test('creates user with strong password and sets cookies', async () => {
    const u = newUser()
    const res = await request(app).post('/api/auth/register').send(u)
    expect([200, 201]).toContain(res.status)
    expect(res.body.success).toBe(true)
    expect(res.body.user).toBeTruthy()
    expect(res.body.user.email).toBe(u.email)
    // Cookie should be set
    const setCookie = res.headers['set-cookie'] || []
    expect(setCookie.length).toBeGreaterThan(0)
  })
})

describe('POST /api/auth/login', () => {
  test('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@nope.com', password: 'TestPass!123Strong' })
    expect([400, 401]).toContain(res.status)
  })

  test('rejects wrong password', async () => {
    const u = newUser()
    await request(app).post('/api/auth/register').send(u)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: u.email, password: 'WrongPass!123' })
    expect([400, 401]).toContain(res.status)
  })

  test('logs in with correct credentials', async () => {
    const u = newUser()
    await request(app).post('/api/auth/register').send(u)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: u.email, password: u.password })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe(u.email)
  })
})

describe('GET /api/auth/profile', () => {
  test('401 without token', async () => {
    const res = await request(app).get('/api/auth/profile')
    expect(res.status).toBe(401)
  })

  test('200 with valid token', async () => {
    const u = newUser()
    const reg = await request(app).post('/api/auth/register').send(u)
    const token = reg.body.token || extractAccessToken(reg.headers['set-cookie'])
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(u.email)
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
