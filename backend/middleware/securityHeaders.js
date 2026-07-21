import helmet from 'helmet'

const isProd = process.env.NODE_ENV === 'production'

export const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],

        styleSrc: ["'self'", isProd ? "'none'" : "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", isProd ? "'none'" : "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",

          'https://emkc.org',

          'https://leetcode.com',

          'https://api.openai.com',
          ...(isProd ? [] : ['ws:', 'http://localhost:*']),
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    strictTransportSecurity: isProd
      ? { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    xPoweredBy: false,
    frameguard: { action: 'deny' },
  })

export const permissionsPolicy = (req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'clipboard-read=(self)',
      'clipboard-write=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
    ].join(', ')
  )
  next()
}
