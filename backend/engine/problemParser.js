/**
 * Problem parser — turns free-form problem text (paste, copy-paste, or
 * a partial LeetCode problem) into a `ProblemSpec` the engine can work
 * with.
 *
 * Input is whatever the user has: the body of a LeetCode problem, a
 * description block from another site, or even a one-liner. The parser
 * is deliberately lenient — when it can't extract a field, it leaves it
 * undefined. The downstream `patternDetector` and `stepGenerator` work
 * with what they have.
 *
 * Spec shape:
 *   {
 *     title: string,
 *     description: string,
 *     tags: string[],
 *     examples: Array<{ input: any, output: any, explanation?: string }>,
 *     constraints: string[],
 *     source: 'pasted' | 'url' | 'curated',
 *     sourceUrl?: string,
 *   }
 */

const LEETCODE_URL_RE = /https?:\/\/(?:www\.)?leetcode\.(?:com|cn)\/problems\/([\w-]+)/i

/**
 * Top-level entry. If the input contains a LeetCode URL, it returns a
 * `sourceUrl`-flagged spec; full scraping requires auth and is handled
 * elsewhere.
 *
 * @param {string} text
 * @returns {{
 *   spec: ProblemSpec,
 *   leetcodeSlug: string | null,
 *   warnings: string[]
 * }}
 */
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

  // 1. Title
  const title = extractTitle(raw) || 'Untitled'

  // 2. Description (the prose between the title and the first Example/Constraints header)
  const description = extractDescription(raw)

  // 3. Examples
  const examples = extractExamples(raw)
  if (examples.length === 0) warnings.push('no examples found')

  // 4. Tags (rare in pasted text; defaults to [])
  const tags = extractTags(raw)

  // 5. Constraints
  const constraints = extractConstraints(raw)

  // 6. URL detection
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

/* ------------------------------------------------------------------ */
/* Title                                                               */
/* ------------------------------------------------------------------ */

function extractTitle(raw) {
  // First non-empty line is the title — works for the typical
  //   1. Two Sum
  //   Two Sum
  //   **Two Sum** (Common)
  const firstLine = raw.split(/\r?\n/).find((l) => l.trim())
  if (!firstLine) return null
  return firstLine
    .replace(/^\d+\.\s*/, '')       // 1. Two Sum
    .replace(/^#+\s*/, '')          // # Two Sum
    .replace(/^\*+|\*+$/g, '')       // **Two Sum**
    .replace(/^[`"']+|[`"']+$/g, '') // "Two Sum"
    .trim()
}

/* ------------------------------------------------------------------ */
/* Description                                                         */
/* ------------------------------------------------------------------ */

function extractDescription(raw) {
  // Strip the title line, then the examples/constraints blocks
  const lines = raw.split(/\r?\n/)
  const firstLineIdx = lines.findIndex((l) => l.trim())
  const body = lines.slice(firstLineIdx + 1).join('\n')
  // Cut at the first Example/Constraints/Follow-up marker
  const cut = body.search(/(?:^|\n)\s*(?:#{0,3}\s*)?(Example|Example\s*\d|Constraint|Follow[- ]up)\b/i)
  return (cut >= 0 ? body.slice(0, cut) : body).trim()
}

/* ------------------------------------------------------------------ */
/* Examples                                                            */
/* ------------------------------------------------------------------ */

function extractExamples(raw) {
  // Match `Input: ...\nOutput: ...` blocks (with optional Explanation).
  // Tolerant of markdown fences and bold markers.
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
  // Walk line by line. The first line starting with `Key:` is the
  // value; keep appending continuation lines until the next `Key:`
  // line or end of body.
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

/** Coerce a pasted value to JS: arrays to arrays, numbers to numbers, etc. */
function coerceValue(v) {
  const s = String(v).trim()
  if (s.startsWith('[') && s.endsWith(']')) {
    try { return JSON.parse(s.replace(/'/g, '"')) } catch { /* fall through */ }
    // Fallback: split on commas
    return s
      .slice(1, -1)
      .split(/,\s*/)
      .map((p) => coerceValue(p))
  }
  if (/^-?\d+$/.test(s)) return Number(s)
  if (/^".*"$/.test(s) || /^'.*'$/.test(s)) return s.slice(1, -1)
  return s
}

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */

function extractTags(raw) {
  // Look for `Tags: array, hash table` or backticked `Array, Hash Table`
  const m = raw.match(/(?:^|\n)\s*Tags?\s*:\s*([^\n]+)/i)
  if (m) return m[1].split(/,\s*/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  // No tags? Try to detect from the topic section at the end
  const t = raw.match(/(?:^|\n)\s*Topics?\s*:\s*([^\n]+)/i)
  if (t) return t[1].split(/,\s*/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  return []
}

/* ------------------------------------------------------------------ */
/* Constraints                                                         */
/* ------------------------------------------------------------------ */

function extractConstraints(raw) {
  const idx = raw.search(/(?:^|\n)\s*(?:#{0,3}\s*)?Constraints?\b/i)
  if (idx < 0) return []
  const tail = raw.slice(idx)
  const lines = tail.split(/\r?\n/).slice(1) // drop the header
  const out = []
  for (const l of lines) {
    const t = l.trim()
    if (!t) continue
    if (/^(Example|Explanation|Notes?|Follow[- ]up)\b/i.test(t)) break
    out.push(t.replace(/^[-*]\s*/, '').replace(/^`+|`+$/g, ''))
  }
  return out
}
