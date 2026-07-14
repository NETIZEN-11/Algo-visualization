/**
 * Migration runner — applies migrations in `migrations/` in order.
 *
 * Each migration is `{ up: async (db) => {...}, down: async (db) => {...} }`.
 * The runner records applied versions in a `migrations` collection so it
 * is idempotent. Run with: `node scripts/migrate.js up`.
 *
 * For our schema work, all index additions and field migrations live
 * in the model files (Mongoose builds indexes on connect), so this
 * runner is for ad-hoc data migrations only.
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import { logger } from '../utils/logger.js'

const MIGRATION_COLLECTION = 'migrations'

const ensureMigrationsCollection = async () => {
  const db = mongoose.connection.db
  const cols = await db.listCollections({ name: MIGRATION_COLLECTION }).toArray()
  if (!cols.length) await db.createCollection(MIGRATION_COLLECTION)
  return db.collection(MIGRATION_COLLECTION)
}

const getApplied = async (coll) => {
  const docs = await coll.find({}).sort({ version: 1 }).toArray()
  return new Set(docs.map((d) => d.version))
}

const recordApplied = async (coll, version) => {
  await coll.insertOne({ version, appliedAt: new Date() })
}

const listMigrations = async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const url = await import('node:url')
  const dir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'migrations')
  let entries
  try { entries = await fs.readdir(dir) } catch { return [] }
  return entries
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => ({ file: f, version: f.replace(/\.js$/, '') }))
}

const importMigration = async (file) => {
  const path = await import('node:path')
  const url = await import('node:url')
  const dir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'migrations')
  return import(`${dir}/${file}`)
}

const main = async () => {
  const cmd = process.argv[2] || 'up'
  await mongoose.connect(process.env.MONGODB_URI)
  const coll = await ensureMigrationsCollection()
  const applied = await getApplied(coll)
  const all = await listMigrations()

  if (cmd === 'status') {
    for (const m of all) console.log(`${applied.has(m.version) ? '✓' : ' '} ${m.version}`)
    await mongoose.disconnect()
    return
  }

  if (cmd === 'up') {
    for (const m of all) {
      if (applied.has(m.version)) continue
      const mod = await importMigration(m.file)
      logger.info({ version: m.version }, 'applying migration')
      await mod.up(mongoose.connection.db)
      await recordApplied(coll, m.version)
      logger.info({ version: m.version }, 'applied')
    }
  } else if (cmd === 'down') {
    // down() reverses the most recent applied migration
    for (const m of [...all].reverse()) {
      if (!applied.has(m.version)) continue
      const mod = await importMigration(m.file)
      logger.info({ version: m.version }, 'reverting migration')
      await mod.down(mongoose.connection.db)
      await coll.deleteOne({ version: m.version })
      logger.info({ version: m.version }, 'reverted')
      break
    }
  } else {
    console.error('Usage: node scripts/migrate.js [up|down|status]')
    process.exit(1)
  }
  await mongoose.disconnect()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('migrate failed:', err)
  process.exit(1)
})
