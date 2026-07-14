/**
 * Daily-challenge worker.
 *
 * Runs as a separate process: `node workers/dailyChallengeWorker.js`.
 * Uses a Mongo lease to ensure only one replica seeds the daily
 * challenge, even when multiple workers are running in parallel.
 *
 * Cron schedule: every minute, attempt to ensure today's challenge.
 * The actual write is idempotent so this is safe to run frequently.
 */
import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/database.js'
import { ensureTodaysChallenge } from '../controllers/gamificationController.js'
import { withLease } from '../services/distributedLockService.js'
import { logger } from '../utils/logger.js'
import mongoose from 'mongoose'
import crypto from 'node:crypto'

const WORKER_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
const LEASE_NAME = 'daily-challenge'
const LEASE_TTL_MS = 60 * 1000
const TICK_MS = 60 * 1000 // every minute

const tick = async () => {
  try {
    const { ran, reason } = await withLease(LEASE_NAME, WORKER_ID, LEASE_TTL_MS, async () => {
      const ch = await ensureTodaysChallenge()
      return ch ? ch._id?.toString() : null
    })
    if (ran) logger.info({ workerId: WORKER_ID, challenge: reason }, 'daily-challenge tick ran')
    else logger.debug({ workerId: WORKER_ID, reason }, 'daily-challenge tick skipped')
  } catch (err) {
    logger.error({ err: err.message, workerId: WORKER_ID }, 'daily-challenge tick failed')
  }
}

const shutdown = async (signal) => {
  logger.info({ signal, workerId: WORKER_ID }, 'daily-challenge worker shutting down')
  try { await mongoose.connection.close() } catch {}
  process.exit(0)
}

const start = async () => {
  await connectDB()
  logger.info({ workerId: WORKER_ID, tickMs: TICK_MS }, 'daily-challenge worker started')
  // Initial tick on boot, then interval.
  await tick()
  setInterval(tick, TICK_MS)
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('worker start failed:', err)
  process.exit(1)
})
