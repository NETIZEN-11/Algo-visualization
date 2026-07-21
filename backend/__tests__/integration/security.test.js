import request from 'supertest'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

process.env.DISABLE_CSRF = 'true'
process.env.RUN_SERVER = 'false'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
const { default: app } = await import('../../server.js')

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => { await clearTestDB() })

describe('Security headers', () => {
  test('GET /health/live includes CSP, HSTS, X-Frame-Options', async () => {
    const res = await request(app).get('/health/live')
    expect(res.status).toBe(200)
    expect(res.headers['content-security-policy']).toBeTruthy()
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})

describe('Error envelope', () => {
  test('404 returns a structured error', async () => {
    const res = await request(app).get('/api/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.code).toBeTruthy()
  })
})

describe('CORS', () => {
  test('unknown origin is blocked', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Origin', 'http://evil.example.com')

    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  test('allowed origin gets CORS headers', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Origin', 'http://localhost:5173')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })
})
