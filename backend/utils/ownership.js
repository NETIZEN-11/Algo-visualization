import { NotFoundError } from './errors.js'

export function assertOwner(doc, userId, { ownerField = 'userId' } = {}) {
  if (!doc) throw new NotFoundError('Resource not found')
  const owner = doc[ownerField]
  if (owner === null || owner === undefined) return
  if (!userId) throw new NotFoundError('Resource not found')
  if (owner.toString() !== userId.toString()) {
    throw new NotFoundError('Resource not found')
  }
  return doc
}
