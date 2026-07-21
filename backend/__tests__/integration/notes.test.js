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
  name: `Note User ${++counter}`,
  email: `note_${counter}_${Date.now()}@example.com`,
  password: 'TestPass!123Strong',
})

let token = null
let user = null

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => {
  await clearTestDB()
  user = newUser()
  const reg = await request(app).post('/api/auth/register').send(user)
  token = reg.body.token || extractAccessToken(reg.headers['set-cookie'])
})

const auth = () => ({ Authorization: `Bearer ${token}` })

describe('Notes CRUD', () => {
  test('GET /api/notes → empty list initially', async () => {
    const res = await request(app).get('/api/notes').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.count).toBe(0)
  })

  test('POST /api/notes creates a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth())
      .send({ title: 'My note', content: 'body', category: 'general', tags: ['a'] })
    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('My note')
    expect(res.body.data.tags).toEqual(['a'])
  })

  test('PUT /api/notes/:id updates a note', async () => {
    const create = await request(app)
      .post('/api/notes').set(auth())
      .send({ title: 'Old', content: 'x' })
    const id = create.body.data._id
    const res = await request(app)
      .put(`/api/notes/${id}`).set(auth())
      .send({ title: 'New' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('New')
  })

  test('POST /api/notes/:id/pin toggles pin', async () => {
    const create = await request(app)
      .post('/api/notes').set(auth())
      .send({ title: 'Pin me', content: 'some content' })
    const id = create.body.data._id
    const res = await request(app).post(`/api/notes/${id}/pin`).set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data.isPinned).toBe(true)
  })

  test('DELETE /api/notes/:id removes a note', async () => {
    const create = await request(app)
      .post('/api/notes').set(auth())
      .send({ title: 'Del', content: 'some content' })
    const id = create.body.data._id
    const res = await request(app).delete(`/api/notes/${id}`).set(auth())
    expect(res.status).toBe(200)
    const list = await request(app).get('/api/notes').set(auth())
    expect(list.body.data.find((n) => n._id === id)).toBeUndefined()
  })

  test('GET /api/notes requires auth', async () => {
    const res = await request(app).get('/api/notes')
    expect(res.status).toBe(401)
  })

  test('search filter works', async () => {
    await request(app).post('/api/notes').set(auth())
      .send({ title: 'alpha note', content: 'first content' })
    await request(app).post('/api/notes').set(auth())
      .send({ title: 'beta note', content: 'second content' })
    const res = await request(app).get('/api/notes?search=alpha').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].title).toBe('alpha note')
  })
})

function extractAccessToken(cookies) {
  if (!Array.isArray(cookies)) return null
  const m = cookies.join(';').match(/access=([^;]+)/)
  return m ? m[1] : null
}
