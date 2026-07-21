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

const _PistonError = (message, status) => {
  const e = new Error(message)
  e.status = status
  return e
}

export const LANGUAGES = Object.freeze([
  { id: 'cpp',       name: 'C++',          version: '10.2.0',     file: 'main.cpp', aliases: ['c++', 'cpp', 'cxx', 'g++'] },
  { id: 'java',      name: 'Java',         version: '15.0.2',     file: 'Main.java', aliases: ['java'] },
  { id: 'python',    name: 'Python 3',     version: '3.10.0',     file: 'main.py',  aliases: ['python', 'python3', 'py'] },
  { id: 'javascript',name: 'JavaScript',   version: '18.15.0',    file: 'main.js',  aliases: ['javascript', 'js', 'node', 'nodejs'] },
  { id: 'typescript',name: 'TypeScript',   version: '5.0.3',      file: 'main.ts',  aliases: ['typescript', 'ts'] },
  { id: 'go',        name: 'Go',           version: '1.16.2',     file: 'main.go',  aliases: ['go', 'golang'] },
  { id: 'rust',      name: 'Rust',         version: '1.68.2',     file: 'main.rs',  aliases: ['rust', 'rs'] },
  { id: 'kotlin',    name: 'Kotlin',       version: '1.8.20',     file: 'Main.kt',  aliases: ['kotlin', 'kt'] },
  { id: 'swift',     name: 'Swift',        version: '5.3.3',      file: 'main.swift', aliases: ['swift'] },
  { id: 'csharp',    name: 'C#',           version: '6.12.0',     file: 'Main.cs',  aliases: ['csharp', 'c#', 'cs', 'dotnet'] },
])

const LANGUAGE_BY_ALIAS = new Map()
for (const l of LANGUAGES) {
  LANGUAGE_BY_ALIAS.set(l.id.toLowerCase(), l)
  for (const a of l.aliases) LANGUAGE_BY_ALIAS.set(a.toLowerCase(), l)
}

export function resolveLanguage(lang) {
  if (!lang) return null
  const key = String(lang).toLowerCase().trim()
  return LANGUAGE_BY_ALIAS.get(key)?.id || null
}

export function getLanguage(lang) {
  if (!lang) return null
  return LANGUAGE_BY_ALIAS.get(String(lang).toLowerCase().trim()) || null
}

function _filenameFor(lang) {
  return getLanguage(lang)?.file || 'main.txt'
}

export const pistonService = {
  listLanguages() {
    return LANGUAGES
  },

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
    const langRecord = getLanguage(language)
    if (!langRecord) {
      return { ok: false, error: `Unsupported language: ${language}` }
    }
    try {
      const { data } = await client.post('/execute', {
        language: langRecord.id,
        version: langRecord.version,
        files: [{ name: langRecord.file, content: source }],
        stdin,
        compile_timeout: 10_000,
        run_timeout: 10_000,
      })
      return { ok: true, data, language: langRecord.id, languageName: langRecord.name }
    } catch (err) {
      const status = err.response?.status
      const msg =
        err.response?.data?.message ||
        (status === 429 ? 'Piston rate limit reached' : 'Piston sandbox unavailable')
      logger.warn({ err: err.message, status, language }, 'pistonService.execute failed')
      return { ok: false, error: msg, status }
    }
  },
}
