import request from 'supertest'
import mongoose from 'mongoose'

process.env.DISABLE_CSRF = 'true'
process.env.DISABLE_RATE_LIMIT = 'true'
process.env.RUN_SERVER = 'false'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'

const { MongoMemoryServer } = await import('mongodb-memory-server')

const TEST_USER = {
  name: 'Smoke Test User',
  email: `smoke_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
}

let mongod = null
let token = null

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

const { default: app } = await import('../server.js')

describe('AlgoVision AI – smoke tests', () => {
  test('GET /health/live → 200', async () => {
    const res = await request(app).get('/health/live')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  test('GET /health/ready → 200 with mongo ready', async () => {
    const res = await request(app).get('/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.mongo).toBe('ready')
  })

  test('GET /metrics → Prometheus text', async () => {
    const res = await request(app).get('/metrics')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toContain('# TYPE')
  })

  test('POST /api/auth/register creates a user', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER)
    expect([200, 201]).toContain(res.status)
    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe(TEST_USER.email)

    const cookies = res.headers['set-cookie'] || []
    expect(cookies.length).toBeGreaterThan(0)
    token = res.body.token || (cookies.join(';').match(/access=([^;]+)/) || [])[1]
  })

  test('POST /api/auth/login works for the same user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEST_USER.email)
  })

  test('GET /api/auth/profile requires auth (401 without token)', async () => {
    const res = await request(app).get('/api/auth/profile')
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/profile returns 200 with valid token', async () => {
    if (!token) return
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEST_USER.email)
  })
})
