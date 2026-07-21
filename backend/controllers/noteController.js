/**
 * Notes controller — full CRUD + pin + search + filter.
 */
import { Note } from '../models/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export const listNotes = wrap(async (req, res) => {
  const { category, search, pinned, sort = '-createdAt', limit = 100, page = 1 } = req.query
  const filter = { userId: req.user._id }
  if (category) filter.category = category
  if (pinned === 'true') filter.isPinned = true
  if (search) filter.$or = [
    { title: { $regex: String(search), $options: 'i' } },
    { content: { $regex: String(search), $options: 'i' } },
    { tags: { $in: [new RegExp(String(search), 'i')] } },
  ]
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 100))
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * lim
  const [notes, total] = await Promise.all([
    Note.find(filter).sort(sort).skip(skip).limit(lim),
    Note.countDocuments(filter),
  ])
  res.json({ success: true, count: notes.length, total, page: parseInt(page, 10), data: notes })
})

export const getNote = wrap(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id })
  if (!note) throw new NotFoundError('Note not found')
  res.json({ success: true, data: note })
})

export const createNote = wrap(async (req, res) => {
  const { title, content, category, tags, problemId, isPinned, color, isPublic } = req.body
  if (!title) throw new ValidationError('Title is required')
  const note = await Note.create({
    userId: req.user._id,
    problemId: problemId || null,
    title,
    content: content || '',
    category: category || 'general',
    tags: Array.isArray(tags) ? tags : [],
    isPinned: !!isPinned,
    color: color || '#3b82f6',
    isPublic: !!isPublic,
  })
  res.status(201).json({ success: true, data: note })
})

export const updateNote = wrap(async (req, res) => {
  const updates = {}
  for (const k of ['title', 'content', 'category', 'tags', 'problemId', 'isPinned', 'color', 'isPublic']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!note) throw new NotFoundError('Note not found')
  res.json({ success: true, data: note })
})

export const deleteNote = wrap(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!note) throw new NotFoundError('Note not found')
  res.json({ success: true, message: 'Note deleted' })
})

export const togglePin = wrap(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id })
  if (!note) throw new NotFoundError('Note not found')
  note.isPinned = !note.isPinned
  await note.save()
  res.json({ success: true, data: note })
})

export default { listNotes, getNote, createNote, updateNote, deleteNote, togglePin }
