import api from './api'

/**
 * Client for the dynamic visualisation engine.
 *
 * Three flavours:
 *   - fromText(rawProblemText) — paste a problem, get steps.
 *   - fromProblem(id) — render steps for a curated DB problem.
 *   - classify(spec) — just detect the pattern; no animation.
 *
 * fromText/fromProblem go through a tiny in-memory cache (10 min TTL).
 * The backend engine is deterministic per-input so re-asking the same
 * paste or the same problem id is safe to memoise — and the user will
 * routinely paste, then tweak, then re-paste the same text, so the
 * cache really earns its keep on the second click.
 */

const TEN_MINUTES = 10 * 60 * 1000
const textCache = new Map()
const problemCache = new Map()

function withCache(cache, key, loader) {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)
  return loader().then((value) => {
    cache.set(key, { value, expires: Date.now() + TEN_MINUTES })
    return value
  })
}

const visualizeService = {
  fromText: (text) =>
    withCache(textCache, text, () =>
      api
        .post('/visualize/from-text', { text })
        .then((r) => r.data.data)
    ),

  fromProblem: (id) =>
    withCache(problemCache, id, () =>
      api
        .get(`/visualize/from-problem/${encodeURIComponent(id)}`)
        .then((r) => r.data.data)
    ),

  classify: (spec) =>
    api
      .post('/visualize/pattern', { spec })
      .then((r) => r.data.data),
}

export default visualizeService
