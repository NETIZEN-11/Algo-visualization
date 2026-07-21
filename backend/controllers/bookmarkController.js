import User from '../models/User.js'

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

export async function addBookmark(req, res, next) {
  try {
    const { algorithmId } = req.body || {}
    if (!algorithmId || typeof algorithmId !== 'string') {
      return res.status(400).json({ message: 'algorithmId is required' })
    }
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.bookmarks.some((b) => b.algorithmId === algorithmId)) {
      user.bookmarks.push({ algorithmId, bookmarkedAt: new Date() })
      await user.save()
    }
    return res.status(201).json({ bookmarked: true, algorithmId })
  } catch (err) {
    return next(err)
  }
}

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
