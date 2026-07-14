/**
 * Cache service — Redis when available, in-memory fallback otherwise.
 *
 * Use cases:
 *   - Rate-limit counters (Phase 1 already uses Redis)
 *   - Leaderboard (60s TTL)
 *   - Daily-challenge (1h)
 *   - getStreak (1m)
 *   - getAnalytics (5m)
 *
 * Two-tier: an L1 in-process LRU + optional L2 Redis. For a single
 * backend instance the L1 is enough; for multi-replica we want L2.
 */
import NodeCache from 'node-cache'
import Redis from 'ioredis'
import { logger } from '../utils/logger.js'

const L1_TTL_SECONDS = 60
const l1 = new NodeCache({ stdTTL: L1_TTL_SECONDS, maxKeys: 5000, checkperiod: 30 })

let l2 = null
let l2Ready = false
const initL2 = () => {
  if (l2) return
  const url = process.env.REDIS_URL
  if (!url) {
    logger.info('Cache: REDIS_URL not set — using in-memory only')
    return
  }
  try {
    l2 = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 5_000,
    })
    l2.on('error', (err) => {
      l2Ready = false
      if (!l2._loggedError) {
        logger.warn({ err: err.message }, 'Cache: Redis error — falling back to L1 only')
        l2._loggedError = true
      }
    })
    l2.connect().then(() => {
      l2Ready = true
      logger.info('Cache: Redis connected')
    }).catch(() => { l2Ready = false })
  } catch (err) {
    logger.warn({ err: err.message }, 'Cache: Redis init failed — using L1 only')
  }
}
initL2()

const l2Get = async (key) => {
  if (!l2Ready) return null
  try { return await l2.get(key) } catch { return null }
}
const l2Set = async (key, val, ttlSec) => {
  if (!l2Ready) return
  try { await l2.set(key, val, 'EX', ttlSec) } catch { /* no-op */ }
}
const l2Del = async (key) => {
  if (!l2Ready) return
  try { await l2.del(key) } catch { /* no-op */ }
}

export const cacheService = {
  /**
   * Get a value, or run the producer and cache its result.
   * Returns the cached/fresh value and a `fromCache` flag.
   */
  async getOrSet(key, ttlSec, producer) {
    // L1
    const l1Hit = l1.get(key)
    if (l1Hit !== undefined) {
      return { value: l1Hit, fromCache: true, tier: 'L1' }
    }
    // L2
    const l2Raw = await l2Get(key)
    if (l2Raw) {
      const parsed = safeParse(l2Raw)
      l1.set(key, parsed, Math.min(ttlSec, L1_TTL_SECONDS))
      return { value: parsed, fromCache: true, tier: 'L2' }
    }
    // Produce
    const value = await producer()
    const ttl = Math.max(1, Math.floor(ttlSec))
    l1.set(key, value, Math.min(ttlSec, L1_TTL_SECONDS))
    l2Set(key, JSON.stringify(value), ttl).catch(() => {})
    return { value, fromCache: false, tier: 'origin' }
  },

  async get(key) {
    const l1Hit = l1.get(key)
    if (l1Hit !== undefined) return l1Hit
    const l2Raw = await l2Get(key)
    if (!l2Raw) return null
    const parsed = safeParse(l2Raw)
    l1.set(key, parsed, L1_TTL_SECONDS)
    return parsed
  },

  async set(key, value, ttlSec) {
    l1.set(key, value, Math.min(ttlSec, L1_TTL_SECONDS))
    await l2Set(key, JSON.stringify(value), ttlSec)
  },

  async del(key) {
    l1.del(key)
    await l2Del(key)
  },

  async flush() {
    l1.flushAll()
    if (l2Ready) {
      try { await l2.flushdb() } catch { /* no-op */ }
    }
  },

  // Test / health
  isL2Ready: () => l2Ready,
  close: async () => { if (l2) await l2.quit().catch(() => {}) },
}

function safeParse(s) {
  try { return JSON.parse(s) } catch { return null }
}
