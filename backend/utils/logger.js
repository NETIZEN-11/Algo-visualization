import pino from 'pino'
import pinoHttp from 'pino-http'

const isProd = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: {
    service: 'algovision-backend',
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,service,env,version',
        },
      },
})

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customProps: (req) => ({ requestId: req.id, userId: req.user?._id?.toString() || null }),

  autoLogging: {
    ignore: (req) => req.url === '/health/live' || req.url === '/health/ready' || req.url === '/metrics',
  },
})
