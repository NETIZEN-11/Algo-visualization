import api from './api'

export const playgroundService = {
  execute: async ({ language, code, source, stdin = '', args = [] }) => {
    const { data } = await api.post('/playground/execute', {
      language,
      source: source ?? code,
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
