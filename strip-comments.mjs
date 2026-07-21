import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'

const ROOTS = ['backend', 'frontend']
const EXTS = new Set(['.js', '.jsx', '.cjs', '.mjs'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', 'build', '.next'])

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (EXTS.has(extname(e.name))) yield full
  }
}


const OPERATOR_CHARS = new Set('=([,;:!&|?+~^{}<>')

function isRegexContext(src, i) {
  let j = i - 1
  while (j >= 0 && /\s/.test(src[j])) j--
  if (j < 0) return true
  const prev = src[j]
  if (OPERATOR_CHARS.has(prev)) return true
  if (prev === ';') return true
  if (prev === ',') return true
  return false
}

function strip(src) {
  let out = ''
  let i = 0
  const n = src.length
  let inStr = null
  let inRegex = false
  let inLineComment = false
  let inBlockComment = false

  while (i < n) {
    const c = src[i]
    const c2 = src[i + 1]

    if (inLineComment) {
      if (c === '\n') { inLineComment = false; out += '\n' }
      i++
      continue
    }
    if (inBlockComment) {
      if (c === '*' && c2 === '/') { inBlockComment = false; i += 2 }
      else if (c === '\n') { out += '\n'; i++ }
      else i++
      continue
    }
    if (inStr) {
      out += c
      if (c === '\\' && i + 1 < n) {
        out += c2
        i += 2
        continue
      }
      if (c === inStr) inStr = null
      i++
      continue
    }
    if (inRegex) {
      out += c
      if (c === '\\' && i + 1 < n) {
        out += c2
        i += 2
        continue
      }
      if (c === '[') {
        let j = i + 1
        while (j < n && src[j] !== ']') {
          if (src[j] === '\\') j++
          j++
        }
        out += src.slice(i + 1, j + 1)
        i = j + 1
        continue
      }
      if (c === '/') {
        inRegex = false
        let j = i + 1
        while (j < n && /[gimsuy]/.test(src[j])) j++
        out += src.slice(i + 1, j)
        i = j
      } else {
        i++
      }
      continue
    }

    if (c === '/' && c2 === '/') {
      inLineComment = true
      i += 2
      continue
    }
    if (c === '/' && c2 === '*') {
      inBlockComment = true
      i += 2
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c
      out += c
      i++
      continue
    }
    if (c === '/' && isRegexContext(src, i)) {
      inRegex = true
      out += c
      i++
      continue
    }
    out += c
    i++
  }
  return out
}

let count = 0
for (const root of ROOTS) {
  try {
    for await (const file of walk(root)) {
      const orig = await readFile(file, 'utf8')
      const stripped = strip(orig)
      if (stripped !== orig) {
        const cleaned = stripped
          .replace(/^[ \t]*\n+/, '')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
        await writeFile(file, cleaned, 'utf8')
        count++
      }
    }
  } catch (e) {
    console.error('err on', root, e.message)
  }
}
console.log(`${count} files modified.`)
