/**
 * Playground controller — execute user code via the Piston sandbox.
 *
 * Piston (https://github.com/engineer-man/piston) is a code-execution
 * API that runs untrusted code in a hardened container. The official
 * public instance is `https://emkc.org/api/v2/piston`. We forward the
 * user's (source, language, stdin) to it and return the result.
 *
 * Limits (defensive — Piston also caps internally):
 *   - max 50_000 chars of source
 *   - max 10_000 chars of stdin
 *   - max 10s per run / compile
 */
import { ServiceUnavailableError, ValidationError } from '../utils/errors.js'
import { pistonService, LANGUAGES, resolveLanguage } from '../services/pistonService.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
/* POST /playground/execute                                             */
/* ------------------------------------------------------------------ */
export const execute = wrap(async (req, res) => {
  const { language, source, code, stdin = '', args = [] } = req.body
  const sourceCode = source ?? code
  if (!language) throw new ValidationError('language is required')
  if (!sourceCode) throw new ValidationError('source is required')

  // Accepts 'cpp', 'c++', 'python3', 'node', etc.
  const canonical = resolveLanguage(language)
  if (!canonical) {
    throw new ValidationError(
      `Unsupported language "${language}". Supported: ${LANGUAGES.map((l) => l.id).join(', ')}`
    )
  }

  if (String(sourceCode).length > 50_000) {
    throw new ValidationError('source is too long (max 50,000 chars)')
  }
  if (String(stdin).length > 10_000) {
    throw new ValidationError('stdin is too long (max 10,000 chars)')
  }

  const result = await pistonService.execute({ language: canonical, source: sourceCode, stdin, args })
  if (!result.ok) {
    throw new ServiceUnavailableError(result.error || 'Sandbox unavailable')
  }
  res.json({ success: true, data: { ...result.data, language: result.language, languageName: result.languageName } })
})

/* ------------------------------------------------------------------ */
/* GET /playground/runtimes — return the static 10-language registry.   */
/* ------------------------------------------------------------------ */
export const getRuntimes = wrap(async (_req, res) => {
  // Live list from Piston (may include other runtimes)
  const live = await pistonService.listRuntimes()
  res.json({
    success: true,
    data: {
      supported: LANGUAGES,            // the canonical 10 we expose
      live: Array.isArray(live) ? live : [],  // whatever Piston currently has
    },
  })
})

export default { execute, getRuntimes }
