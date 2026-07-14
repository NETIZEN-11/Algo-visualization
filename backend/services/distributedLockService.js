/**
 * Distributed lease (Mongo-based) for the daily-challenge worker.
 *
 * Multiple backend replicas can run `dailyChallengeWorker`; only one
 * will hold the lease and actually write the challenge. Others will
 * see the lease is held and exit (or wait for the TTL).
 *
 * The lease is a single document in a `leases` collection. We use
 * `findOneAndUpdate` with conditional `expiresAt` to atomically grab
 * or extend the lease.
 */
import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

const LeaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    acquiredAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)
const Lease = mongoose.models.Lease || mongoose.model('Lease', LeaseSchema)

const DEFAULT_TTL_MS = 60 * 1000 // 1 minute

export const distributedLockService = {
  /**
   * Try to acquire `name` for `owner` for `ttlMs`. Returns true if held.
   */
  async acquire(name, owner, ttlMs = DEFAULT_TTL_MS) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlMs)
    const res = await Lease.findOneAndUpdate(
      {
        name,
        $or: [{ expiresAt: { $lte: now } }, { owner }],
      },
      { $set: { owner, acquiredAt: now, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return !!res && res.owner === owner && res.expiresAt > now
  },

  /** Extend the lease if we still own it. */
  async renew(name, owner, ttlMs = DEFAULT_TTL_MS) {
    const now = new Date()
    const res = await Lease.updateOne(
      { name, owner, expiresAt: { $gt: now } },
      { $set: { expiresAt: new Date(now.getTime() + ttlMs) } }
    )
    return res.modifiedCount === 1
  },

  /** Release the lease. */
  async release(name, owner) {
    await Lease.deleteOne({ name, owner })
  },

  async getLease(name) {
    return Lease.findOne({ name }).lean()
  },
}

export const withLease = async (name, owner, ttlMs, fn) => {
  const got = await distributedLockService.acquire(name, owner, ttlMs)
  if (!got) {
    logger.debug({ name, owner }, 'withLease: another worker holds the lease')
    return { ran: false, reason: 'lease-held' }
  }
  try {
    const result = await fn()
    return { ran: true, result }
  } finally {
    await distributedLockService.release(name, owner).catch(() => {})
  }
}
