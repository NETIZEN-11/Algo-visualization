/**
 * HTTP security headers (CSP, HSTS, etc.).
 *
 * Helmet sets a sensible default; we layer a stricter, allow-list-driven CSP
 * on top and ensure HSTS is on whenever the app is served over HTTPS (which
 * is implied once a TLS terminator sits in front).
 */
import helmet from 'helmet'

const isProd = process.env.NODE_ENV === 'production'

export const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        // Frontend bundles inline styles via Vite/Framer Motion in dev; allow unsafe-inline in dev only.
        styleSrc: ["'self'", isProd ? "'none'" : "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", isProd ? "'none'" : "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          // Piston sandbox — used by the playground
          'https://emkc.org',
          // LeetCode — used by the scraper
          'https://leetcode.com',
          // OpenAI — used by the AI service
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

/** Permissions-Policy — deny powerful features by default. */
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
