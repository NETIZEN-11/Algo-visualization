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
  name: `Sub User ${++counter}`,
  email: `sub_${counter}_${Date.now()}@example.com`,
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

describe('Submissions', () => {
  test('GET /api/submissions → empty list', async () => {
    const res = await request(app).get('/api/submissions').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  test('POST /api/submissions validates input', async () => {
    const res = await request(app).post('/api/submissions').set(auth()).send({})
    expect([400, 422]).toContain(res.status)
  })

  test('POST /api/submissions creates a record', async () => {

    const Problem = (await import('../../models/Problem.js')).default
    const problem = await Problem.create({
      problemId: `prob_test_${++counter}_${Date.now()}`,
      userId: null,
      source: 'system',
      title: 'Test problem',
      slug: 'test-problem',
      difficulty: 'Easy',
      description: 'A test problem',
    })

    const res = await request(app).post('/api/submissions').set(auth()).send({
      problemId: problem._id.toString(),
      code: 'print(2+2)',
      language: 'python',
      status: 'accepted',
    })
    expect([200, 201]).toContain(res.status)
    expect(res.body.data.language).toBe('python')
    expect(res.body.data.status).toBe('accepted')
  })

  test('GET /api/submissions requires auth', async () => {
    const res = await request(app).get('/api/submissions')
    expect(res.status).toBe(401)
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
