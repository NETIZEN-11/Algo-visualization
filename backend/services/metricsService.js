const counters = new Map()
const gauges = new Map()
const histograms = new Map()

const inc = (name, labels = {}, value = 1) => {
  const key = labelsKey(labels)
  const c = counters.get(name) || { help: '', values: new Map() }
  c.values.set(key, (c.values.get(key) || 0) + value)
  counters.set(name, c)
}

const set = (name, value) => {
  gauges.set(name, { value })
}

const observe = (name, value, bucketSpec) => {
  const h = histograms.get(name) || { help: '', buckets: bucketSpec, values: new Map() }
  if (!h.values.size) {
    for (const b of bucketSpec) h.values.set(`le_${b}`, 0)
    h.values.set('le_+Inf', 0)
  }
  for (const b of bucketSpec) if (value <= b) h.values.set(`le_${b}`, h.values.get(`le_${b}`) + 1)
  h.values.set('le_+Inf', h.values.get('le_+Inf') + 1)
  h.sum = (h.sum || 0) + value
  h.count = (h.count || 0) + 1
  histograms.set(name, h)
}

const labelsKey = (labels) => Object.keys(labels).sort().map((k) => `${k}=${labels[k]}`).join('|')

const register = (name, help, type, labels = []) => {
  const entry = { name, help, type, labels }
  if (type === 'counter') counters.set(name, { help, values: new Map() })
  if (type === 'gauge') gauges.set(name, { help, value: 0, labels })
  return entry
}

register('http_requests_total', 'Total HTTP requests', 'counter', ['method', 'route', 'status'])
register('http_request_duration_seconds', 'HTTP request duration in seconds', 'histogram', ['method', 'route', 'status'])
register('ai_tokens_total', 'OpenAI tokens consumed', 'counter', ['feature', 'model'])
register('ai_calls_total', 'AI calls made', 'counter', ['feature', 'outcome'])
register('auth_events_total', 'Authentication events', 'counter', ['event'])
register('errors_total', 'Application errors', 'counter', ['code', 'route'])

const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

const recordHttp = (req, res, durationSec) => {
  const route = req.route?.path || req.baseUrl + (req.route?.path || '') || req.path || 'unknown'
  const labels = { method: req.method, route, status: String(res.statusCode) }
  inc('http_requests_total', labels)
  observe('http_request_duration_seconds', durationSec, BUCKETS)
}

const recordAi = (feature, outcome, model, tokens) => {
  inc('ai_calls_total', { feature, outcome })
  if (model) inc('ai_tokens_total', { feature, model }, tokens || 0)
}

const recordError = (code, route) => {
  inc('errors_total', { code: String(code || 'UNKNOWN'), route: String(route || 'unknown') })
}

const recordAuth = (event) => {
  inc('auth_events_total', { event })
}

const render = () => {
  const lines = []

  for (const [name, c] of counters) {
    lines.push(`# HELP ${name} ${c.help}`)
    lines.push(`# TYPE ${name} counter`)
    for (const [key, v] of c.values) {
      const labelStr = key ? `{${key}}` : ''
      lines.push(`${name}${labelStr} ${v}`)
    }
  }

  for (const [name, g] of gauges) {
    lines.push(`# HELP ${name} ${g.help || ''}`)
    lines.push(`# TYPE ${name} gauge`)
    lines.push(`${name} ${g.value}`)
  }

  for (const [name, h] of histograms) {
    lines.push(`# HELP ${name} ${h.help || ''}`)
    lines.push(`# TYPE ${name} histogram`)
    for (const [key, v] of h.values) {
      const le = key.replace('le_', '')
      lines.push(`${name}_bucket{le="${le}"} ${v}`)
    }
    lines.push(`${name}_sum ${h.sum || 0}`)
    lines.push(`${name}_count ${h.count || 0}`)
  }
  return lines.join('\n') + '\n'
}

export const metricsService = {
  register,
  inc,
  set,
  observe,
  recordHttp,
  recordAi,
  recordError,
  recordAuth,
  render,
}
