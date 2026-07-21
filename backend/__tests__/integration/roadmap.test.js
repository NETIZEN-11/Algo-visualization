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
  name: `RM User ${++counter}`,
  email: `rm_${counter}_${Date.now()}@example.com`,
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

describe('Roadmap', () => {
  test('GET auto-creates with 12 default topics', async () => {
    const res = await request(app).get('/api/roadmap').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data.topics.length).toBe(12)
    expect(res.body.data.topics[0].topicId).toBe('arrays-hashing')
  })

  test('PUT /api/roadmap/progress persists completion', async () => {
    const res = await request(app)
      .put('/api/roadmap/progress')
      .set(auth())
      .send({ topicId: 'arrays-hashing', completed: true, problemsSolved: 7 })
    expect(res.status).toBe(200)
    const t = res.body.data.topics.find((x) => x.topicId === 'arrays-hashing')
    expect(t.completed).toBe(true)
    expect(t.problemsSolved).toBe(7)
  })

  test('PUT with unknown topic → 404', async () => {
    const res = await request(app)
      .put('/api/roadmap/progress')
      .set(auth())
      .send({ topicId: 'unknown-topic', completed: true })
    expect(res.status).toBe(404)
  })

  test('POST /api/roadmap/reset clears progress', async () => {
    await request(app)
      .put('/api/roadmap/progress')
      .set(auth())
      .send({ topicId: 'arrays-hashing', completed: true, problemsSolved: 5 })
    const res = await request(app).post('/api/roadmap/reset').set(auth())
    expect(res.status).toBe(200)
    const t = res.body.data.topics.find((x) => x.topicId === 'arrays-hashing')
    expect(t.completed).toBe(false)
    expect(t.problemsSolved).toBe(0)
  })

  test('GET /api/roadmap requires auth', async () => {
    const res = await request(app).get('/api/roadmap')
    expect(res.status).toBe(401)
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
