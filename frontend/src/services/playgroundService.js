import api from './api'

/**
 * Playground service — real code execution via the backend (Piston).
 */
export const playgroundService = {
  execute: async ({ language, code, stdin }) => {
    const { data } = await api.post('/playground/execute', { language, code, stdin })
    return data
  },
  runtimes: async () => {
    const { data } = await api.get('/playground/runtimes')
    return data
  },
}

export default playgroundService
