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
