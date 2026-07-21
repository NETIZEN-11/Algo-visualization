import request from 'supertest'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

process.env.DISABLE_CSRF = 'true'
process.env.RUN_SERVER = 'false'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
const { default: app } = await import('../../server.js')

let counter = 0
const newUser = () => ({
  name: `GM User ${++counter}`,
  email: `gm_${counter}_${Date.now()}@example.com`,
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

describe('Gamification', () => {
  test('GET /api/gamification/leaderboard → at least current user', async () => {
    const res = await request(app).get('/api/gamification/leaderboard').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data.rankings).toBeDefined()
  })

  test('GET /api/gamification/badges → array', async () => {
    const res = await request(app).get('/api/gamification/badges').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('GET /api/gamification/daily-challenge → seed and return', async () => {
    const res = await request(app).get('/api/gamification/daily-challenge').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toBeTruthy()
    expect(res.body.data.problem).toBeTruthy()
    expect(typeof res.body.data.problem.title).toBe('string')
  })

  test('GET /api/gamification/level → object with level info', async () => {
    const res = await request(app).get('/api/gamification/level').set(auth())
    expect(res.status).toBe(200)
    expect(typeof res.body.data.level).toBe('number')
    expect(typeof res.body.data.xp).toBe('number')
  })

  test('Leaderboard cache: second call hits cache', async () => {
    const a = await request(app).get('/api/gamification/leaderboard').set(auth())
    expect(a.status).toBe(200)
    const b = await request(app).get('/api/gamification/leaderboard').set(auth())
    expect(b.status).toBe(200)

    expect(b.headers['x-cache']).toBe('HIT')
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
