import api from './api'

/**
 * Playground service — real code execution via the backend (Piston).
 *
 * The backend accepts `source` (canonical) or `code` (legacy). The
 * frontend always sends `code` for ergonomics.
 */
export const playgroundService = {
  execute: async ({ language, code, source, stdin = '', args = [] }) => {
    const { data } = await api.post('/playground/execute', {
      language,
      source: source ?? code, // backend accepts either
      stdin,
      args,
    })
    return data
  },
  runtimes: async () => {
    const { data } = await api.get('/playground/runtimes')
    return data
  },
}

export default playgroundService
