import { NotFoundError } from './errors.js'

/**
 * Assert that the given document is owned by the requesting user.
 * Throws 404 (not 403) so we don't leak the existence of the resource.
 *
 * `ownerField` defaults to `userId`. If the document is a system-owned one
 * (e.g. daily challenges, with `userId === null`), the check passes.
 */
export function assertOwner(doc, userId, { ownerField = 'userId' } = {}) {
  if (!doc) throw new NotFoundError('Resource not found')
  const owner = doc[ownerField]
  if (owner === null || owner === undefined) return // system-owned
  if (!userId) throw new NotFoundError('Resource not found')
  if (owner.toString() !== userId.toString()) {
    throw new NotFoundError('Resource not found')
  }
  return doc
}
