import { metricsService } from '../services/metricsService.js'

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {

    if (req.path === '/metrics' || req.path === '/health/live' || req.path === '/health/ready') return
    const dur = Number(process.hrtime.bigint() - start) / 1e9
    metricsService.recordHttp(req, res, dur)
  })
  next()
}
