const LEETCODE_URL_RE = /https?:\/\/(?:www\.)?leetcode\.(?:com|cn)\/problems\/([\w-]+)/i

export function parseProblemText(text) {
  const warnings = []
  const raw = String(text || '').trim()
  if (!raw) {
    return {
      spec: { title: 'Untitled', description: '', tags: [], examples: [], constraints: [], source: 'pasted' },
      leetcodeSlug: null,
      warnings: ['empty input'],
    }
  }

  const title = extractTitle(raw) || 'Untitled'

  const description = extractDescription(raw)

  const examples = extractExamples(raw)
  if (examples.length === 0) warnings.push('no examples found')

  const tags = extractTags(raw)

  const constraints = extractConstraints(raw)

  const m = raw.match(LEETCODE_URL_RE)
  const leetcodeSlug = m ? m[1] : null

  return {
    spec: {
      title,
      description,
      tags,
      examples,
      constraints,
      source: 'pasted',
      ...(m ? { sourceUrl: m[0] } : {}),
    },
    leetcodeSlug,
    warnings,
  }
}

function extractTitle(raw) {

  const firstLine = raw.split(/\r?\n/).find((l) => l.trim())
  if (!firstLine) return null
  return firstLine
    .replace(/^\d+\.\s*/, '')
    .replace(/^#+\s*/, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/^[`"']+|[`"']+$/g, '')
    .trim()
}

function extractDescription(raw) {

  const lines = raw.split(/\r?\n/)
  const firstLineIdx = lines.findIndex((l) => l.trim())
  const body = lines.slice(firstLineIdx + 1).join('\n')

  const cut = body.search(/(?:^|\n)\s*(?:#{0,3}\s*)?(Example|Example\s*\d|Constraint|Follow[- ]up)\b/i)
  return (cut >= 0 ? body.slice(0, cut) : body).trim()
}

function extractExamples(raw) {

  const examples = []
  const STOP_HEADERS = '(?:Example|Constraint|Follow[ -]up|Notes?)'
  const blockRe = new RegExp(
    `(?:^|\\n)\\s*(?:#{0,3}\\s*)?(?:Example\\s*\\d*\\s*:?|\\*\\*Example\\*\\*\\s*:?)\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:#{0,3}\\s*)?${STOP_HEADERS}|$)`,
    'gi'
  )

  for (const m of raw.matchAll(blockRe)) {
    const body = m[1]
    const input = matchKV(body, 'Input')
    const output = matchKV(body, 'Output')
    const explanation = matchKV(body, 'Explanation')
    if (input == null && output == null) continue
    examples.push({
      input: input != null ? coerceValue(input) : null,
      output: output != null ? coerceValue(output) : null,
      ...(explanation ? { explanation } : {}),
    })
  }
  return examples
}

function matchKV(body, key) {

  const lines = body.split(/\r?\n/)
  const startRe = new RegExp('^\\s*' + key + '\\s*:\\s*(.*)$', 'i')
  const nextRe = /^\s*(?:Input|Output|Explanation)\s*:/i
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (startRe.test(lines[i])) { start = i; break }
  }
  if (start < 0) return null
  const out = [lines[start].match(startRe)[1]]
  for (let i = start + 1; i < lines.length; i++) {
    if (nextRe.test(lines[i])) break
    out.push(lines[i])
  }
  return out.join('\n').trim()
}

function coerceValue(v) {
  const s = String(v).trim()
  if (s.startsWith('[') && s.endsWith(']')) {
    try { return JSON.parse(s.replace(/'/g, '"')) } catch {  }

    return s
      .slice(1, -1)
      .split(/,\s*/)
      .map((p) => coerceValue(p))
  }
  if (/^-?\d+$/.test(s)) return Number(s)
  if (/^".*"$/.test(s) || /^'.*'$/.test(s)) return s.slice(1, -1)
  return s
}

function extractTags(raw) {

  const m = raw.match(/(?:^|\n)\s*Tags?\s*:\s*([^\n]+)/i)
  if (m) return m[1].split(/,\s*/).map((t) => t.trim().toLowerCase()).filter(Boolean)

  const t = raw.match(/(?:^|\n)\s*Topics?\s*:\s*([^\n]+)/i)
  if (t) return t[1].split(/,\s*/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  return []
}

function extractConstraints(raw) {
  const idx = raw.search(/(?:^|\n)\s*(?:#{0,3}\s*)?Constraints?\b/i)
  if (idx < 0) return []
  const tail = raw.slice(idx)
  const lines = tail.split(/\r?\n/).slice(1)
  const out = []
  for (const l of lines) {
    const t = l.trim()
    if (!t) continue
    if (/^(Example|Explanation|Notes?|Follow[- ]up)\b/i.test(t)) break
    out.push(t.replace(/^[-*]\s*/, '').replace(/^`+|`+$/g, ''))
  }
  return out
}
