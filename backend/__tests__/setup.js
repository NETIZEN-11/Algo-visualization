/**
 * Test setup — boots an isolated MongoDB-memory-server and points the
 * app at it. Each test file gets a fresh database.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod = null

export const setupTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  process.env.MOCK_AI = 'true'
  process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
  process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'
  process.env.NODE_ENV = 'test'
  // Disable CSRF in test (it requires a cookie roundtrip)
  process.env.DISABLE_CSRF = 'true'
  await mongoose.connect(uri)
}

export const teardownTestDB = async () => {
  try { await mongoose.disconnect() } catch {}
  if (mongod) {
    await mongod.stop()
    mongod = null
  }
}

export const clearTestDB = async () => {
  const db = mongoose.connection.db
  if (!db) return
  const cols = await db.listCollections().toArray()
  for (const c of cols) {
    if (c.name.startsWith('system.')) continue
    try { await db.collection(c.name).deleteMany({}) } catch {}
  }
}
