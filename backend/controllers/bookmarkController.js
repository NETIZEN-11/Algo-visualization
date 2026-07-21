import User from '../models/User.js'

/**
 * GET /api/bookmarks
 * Returns the list of bookmarked algorithm IDs for the current user.
 * Includes a convenience map { [algorithmId]: true } for the frontend
 * to look up bookmark state in O(1).
 */
export async function getBookmarks(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('bookmarks').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({
      bookmarks: user.bookmarks || [],
      ids: (user.bookmarks || []).map((b) => b.algorithmId),
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * GET /api/bookmarks/:algorithmId
 * Returns `{ bookmarked: true|false }` for a single algorithm. The
 * frontend's detail page uses this to set its bookmark state on mount.
 */
export async function getBookmark(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('bookmarks').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })
    const id = req.params.algorithmId
    const bookmarked = (user.bookmarks || []).some((b) => b.algorithmId === id)
    return res.json({ bookmarked })
  } catch (err) {
    return next(err)
  }
}

/**
 * POST /api/bookmarks
 * Body: { algorithmId }
 * Adds a bookmark; idempotent — repeated calls don't create duplicates.
 */
export async function addBookmark(req, res, next) {
  try {
    const { algorithmId } = req.body || {}
    if (!algorithmId || typeof algorithmId !== 'string') {
      return res.status(400).json({ message: 'algorithmId is required' })
    }
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    // $addToSet would also work but we want a fresh `bookmarkedAt`
    // on re-add, which the $addToSet semantics wouldn't provide.
    if (!user.bookmarks.some((b) => b.algorithmId === algorithmId)) {
      user.bookmarks.push({ algorithmId, bookmarkedAt: new Date() })
      await user.save()
    }
    return res.status(201).json({ bookmarked: true, algorithmId })
  } catch (err) {
    return next(err)
  }
}

/**
 * DELETE /api/bookmarks/:algorithmId
 * Removes the bookmark. Idempotent — returns 200 either way.
 */
export async function removeBookmark(req, res, next) {
  try {
    const id = req.params.algorithmId
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const before = user.bookmarks.length
    user.bookmarks = user.bookmarks.filter((b) => b.algorithmId !== id)
    if (user.bookmarks.length !== before) await user.save()
    return res.json({ bookmarked: false, algorithmId: id })
  } catch (err) {
    return next(err)
  }
}
