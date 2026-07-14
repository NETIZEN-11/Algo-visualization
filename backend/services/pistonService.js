/**
 * Piston (emkc.org) execution client.
 *
 * Caches the runtime list for 10 minutes; executes one job at a time
 * with a 30-second upstream timeout. The base URL is configurable
 * via `PISTON_URL` for self-hosted deployments.
 */
import axios from 'axios'
import { logger } from '../utils/logger.js'

const BASE = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'
const RUNTIMES_TTL_MS = 10 * 60 * 1000

let cachedRuntimes = null
let cachedAt = 0

const client = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

const PistonError = (message, status) => {
  const e = new Error(message)
  e.status = status
  return e
}

export const pistonService = {
  async listRuntimes() {
    if (cachedRuntimes && Date.now() - cachedAt < RUNTIMES_TTL_MS) return cachedRuntimes
    try {
      const { data } = await client.get('/runtimes')
      cachedRuntimes = data
      cachedAt = Date.now()
      return data
    } catch (err) {
      logger.warn({ err: err.message }, 'pistonService.listRuntimes failed')
      return cachedRuntimes || []
    }
  },

  async execute({ language, source, stdin = '' }) {
    try {
      const { data } = await client.post('/execute', {
        language,
        version: '*', // let Piston pick the latest
        files: [{ name: filenameFor(language), content: source }],
        stdin,
        compile_timeout: 10_000,
        run_timeout: 10_000,
      })
      return { ok: true, data }
    } catch (err) {
      const status = err.response?.status
      const msg =
        err.response?.data?.message ||
        (status === 429 ? 'Piston rate limit reached' : 'Piston sandbox unavailable')
      logger.warn({ err: err.message, status }, 'pistonService.execute failed')
      return { ok: false, error: msg, status }
    }
  },
}

function filenameFor(lang) {
  return {
    python: 'main.py',
    javascript: 'main.js',
    typescript: 'main.ts',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    go: 'main.go',
    rust: 'main.rs',
  }[lang] || 'main.txt'
}
