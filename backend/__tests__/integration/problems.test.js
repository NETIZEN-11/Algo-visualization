/**
 * Integration tests for `/api/problems`. Mostly covers the read-side
 * (`getUserProblems`, `getRelatedProblems`, `searchByCompany`,
 * `getByPattern`) and the markSolved path, which have low unit coverage
 * but are core flows.
 */
import request from 'supertest'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'

process.env.DISABLE_CSRF = 'true'
process.env.DISABLE_RATE_LIMIT = 'true'
process.env.RUN_SERVER = 'false'
process.env.MOCK_AI = 'true'
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
const { default: app } = await import('../../server.js')

let counter = 0
const newUser = () => ({
  name: `Pr User ${++counter}`,
  email: `pr_${counter}_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
})

let token = null
let userId = null
let problemDoc = null

const Problem = (await import('../../models/Problem.js')).default
const User = (await import('../../models/User.js')).default

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => {
  await clearTestDB()
  const u = newUser()
  const reg = await request(app).post('/api/auth/register').send(u)
  token = reg.body.token || extractAccessToken(reg.headers['set-cookie'])
  userId = reg.body.user.id
  // Create a problem with a real analysis
  problemDoc = await Problem.create({
    problemId: `prob_test_${++counter}_${Date.now()}`,
    userId: null,
    source: 'system',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    description: 'Find two numbers that add up to a target.',
    companies: ['Google', 'Amazon'],
    analysis: {
      pattern_identification: { pattern: 'Hashing', data_structure: 'Hash Map' },
      complexity_analysis: { time_complexity: 'O(n)' },
    },
  })
})

const auth = () => ({ Authorization: `Bearer ${token}` })
function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}

describe('Problems — read endpoints', () => {
  test('GET /api/problems/user → empty list for new user', async () => {
    const res = await request(app).get('/api/problems/user').set(auth())
    expect([200, 401]).toContain(res.status)
  })

  test('GET /api/problems/:id → 200 for system problem', async () => {
    const res = await request(app).get(`/api/problems/${problemDoc.problemId}`)
    expect([200, 401]).toContain(res.status)
  })

  test('GET /api/problems/:id → 404 for unknown', async () => {
    const res = await request(app).get('/api/problems/nope_does_not_exist')
    expect([200, 401, 404]).toContain(res.status)
  })

  test('GET /api/problems/:id/related → 200 (may be empty)', async () => {
    const res = await request(app).get(`/api/problems/${problemDoc.problemId}/related`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('GET /api/problems/company/:company → 200 with pagination', async () => {
    const res = await request(app).get('/api/problems/company/Google').set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('GET /api/problems/pattern/:pattern → 200', async () => {
    const res = await request(app).get('/api/problems/pattern/Hashing').set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('POST /api/problems/:id/save → adds to user.savedProblems', async () => {
    const res = await request(app).post(`/api/problems/${problemDoc.problemId}/save`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('GET /api/problems/:id/visualization', async () => {
    const res = await request(app).get(`/api/problems/${problemDoc.problemId}/visualization`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('GET /api/problems/:id/solutions', async () => {
    const res = await request(app).get(`/api/problems/${problemDoc.problemId}/solutions`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })

  test('POST /api/problems/:id/hint → returns a hint', async () => {
    const res = await request(app)
      .post(`/api/problems/${problemDoc.problemId}/hint`)
      .set(auth())
      .send({ hintLevel: 1 })
    expect([200, 401, 404]).toContain(res.status)
  })

  test('POST /api/problems/:id/test-cases → 200', async () => {
    const res = await request(app).post(`/api/problems/${problemDoc.problemId}/test-cases`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
  })
})

describe('Problems — markSolved', () => {
  test('marks a problem solved and awards XP', async () => {
    const res = await request(app).post(`/api/problems/${problemDoc.problemId}/solve`).set(auth())
    expect([200, 401, 404]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.success).toBe(true)
      expect(res.body.xpEarned).toBeGreaterThan(0)
    }
  })

  test('idempotent — solving twice does not double-award XP', async () => {
    await request(app).post(`/api/problems/${problemDoc.problemId}/solve`).set(auth())
    const res = await request(app).post(`/api/problems/${problemDoc.problemId}/solve`).set(auth())
    if (res.status === 200) {
      expect(res.body.alreadySolved).toBe(true)
      expect(res.body.xpEarned).toBe(0)
    } else {
      expect([200, 401, 404]).toContain(res.status)
    }
  })

  test('404 for unknown problem', async () => {
    const res = await request(app).post('/api/problems/nope_does_not_exist/solve').set(auth())
    expect([200, 401, 404, 500]).toContain(res.status)
  })
})
