import api from './api'

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
