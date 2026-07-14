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
 *   - max 30s wall-clock via the upstream timeout
 */
import { NotFoundError, ServiceUnavailableError, ValidationError } from '../utils/errors.js'
import { pistonService } from '../services/pistonService.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export const execute = wrap(async (req, res) => {
  const { language, source, stdin = '' } = req.body
  if (!language) throw new ValidationError('language is required')
  if (!source) throw new ValidationError('source is required')

  const result = await pistonService.execute({ language, source, stdin })
  if (!result.ok) {
    // Surface upstream failure as 503
    throw new ServiceUnavailableError(result.error || 'Sandbox unavailable')
  }
  res.json({ success: true, data: result.data })
})

export const getRuntimes = wrap(async (_req, res) => {
  const list = await pistonService.listRuntimes()
  res.json({ success: true, data: list })
})

export default { execute, getRuntimes }
