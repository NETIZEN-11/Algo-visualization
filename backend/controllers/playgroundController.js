import { ServiceUnavailableError, ValidationError } from '../utils/errors.js'
import { pistonService, LANGUAGES, resolveLanguage } from '../services/pistonService.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export const execute = wrap(async (req, res) => {
  const { language, source, code, stdin = '', args = [] } = req.body
  const sourceCode = source ?? code
  if (!language) throw new ValidationError('language is required')
  if (!sourceCode) throw new ValidationError('source is required')

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

export const getRuntimes = wrap(async (_req, res) => {

  const live = await pistonService.listRuntimes()
  res.json({
    success: true,
    data: {
      supported: LANGUAGES,
      live: Array.isArray(live) ? live : [],
    },
  })
})

export default { execute, getRuntimes }
