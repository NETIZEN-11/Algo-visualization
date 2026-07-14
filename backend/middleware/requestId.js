/**
 * Generates or propagates a request id. Reads `X-Request-Id` from the request
 * if the upstream (load balancer, CDN, frontend) supplied one, otherwise
 * generates a fresh id. The id is exposed on `req.id` and echoed in the
 * `X-Request-Id` response header.
 */
import crypto from 'node:crypto'

export const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id']
  const id = typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
    ? incoming
    : crypto.randomUUID()
  req.id = id
  res.setHeader('X-Request-Id', id)
  next()
}
