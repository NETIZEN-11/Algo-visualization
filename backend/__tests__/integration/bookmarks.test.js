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
  name: `Bookmark User ${++counter}`,
  email: `bookmark_${counter}_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
})

let token = null

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => {
  await clearTestDB()
  const u = newUser()
  const reg = await request(app).post('/api/auth/register').send(u)

  token = extractAccessToken(reg.headers['set-cookie'])
})

const auth = () => ({ Authorization: `Bearer ${token}` })

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}

describe('Bookmarks', () => {
  test('GET /api/bookmarks returns empty list for a new user', async () => {
    const res = await request(app).get('/api/bookmarks').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.ids).toEqual([])
    expect(res.body.bookmarks).toEqual([])
  })

  test('POST /api/bookmarks adds a bookmark', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .set(auth())
      .send({ algorithmId: 'bubble-sort' })
    expect(res.status).toBe(201)
    expect(res.body.bookmarked).toBe(true)
    expect(res.body.algorithmId).toBe('bubble-sort')
  })

  test('POST is idempotent — repeated calls do not duplicate', async () => {
    await request(app).post('/api/bookmarks').set(auth()).send({ algorithmId: 'bubble-sort' })
    await request(app).post('/api/bookmarks').set(auth()).send({ algorithmId: 'bubble-sort' })
    const res = await request(app).get('/api/bookmarks').set(auth())
    expect(res.body.ids.filter((id) => id === 'bubble-sort').length).toBe(1)
  })

  test('POST requires algorithmId', async () => {
    const res = await request(app).post('/api/bookmarks').set(auth()).send({})
    expect(res.status).toBe(400)
  })

  test('POST requires authentication', async () => {
    const res = await request(app).post('/api/bookmarks').send({ algorithmId: 'x' })
    expect(res.status).toBe(401)
  })

  test('GET /api/bookmarks/:id returns the bookmark state', async () => {
    await request(app).post('/api/bookmarks').set(auth()).send({ algorithmId: 'merge-sort' })
    const res = await request(app).get('/api/bookmarks/merge-sort').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.bookmarked).toBe(true)
  })

  test('GET /api/bookmarks/:id returns false for an unbookmarked id', async () => {
    const res = await request(app).get('/api/bookmarks/quick-sort').set(auth())
    expect(res.body.bookmarked).toBe(false)
  })

  test('DELETE /api/bookmarks/:id removes the bookmark', async () => {
    await request(app).post('/api/bookmarks').set(auth()).send({ algorithmId: 'bubble-sort' })
    const del = await request(app).delete('/api/bookmarks/bubble-sort').set(auth())
    expect(del.status).toBe(200)
    expect(del.body.bookmarked).toBe(false)
    const list = await request(app).get('/api/bookmarks').set(auth())
    expect(list.body.ids).not.toContain('bubble-sort')
  })

  test('DELETE on a non-existent bookmark is idempotent', async () => {
    const res = await request(app).delete('/api/bookmarks/never-bookmarked').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.bookmarked).toBe(false)
  })
})
