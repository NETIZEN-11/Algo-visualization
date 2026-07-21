import api from './api'

/**
 * Client for the dynamic visualisation engine.
 *
 * Three flavours:
 *   - fromText(rawProblemText) — paste a problem, get steps.
 *   - fromProblem(id) — render steps for a curated DB problem.
 *   - classify(spec) — just detect the pattern; no animation.
 */
const visualizeService = {
  fromText: (text) =>
    api
      .post('/visualize/from-text', { text })
      .then((r) => r.data.data),

  fromProblem: (id) =>
    api
      .get(`/visualize/from-problem/${encodeURIComponent(id)}`)
      .then((r) => r.data.data),

  classify: (spec) =>
    api
      .post('/visualize/pattern', { spec })
      .then((r) => r.data.data),
}

export default visualizeService
