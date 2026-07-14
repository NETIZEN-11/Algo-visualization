/**
 * Admin controller — RBAC gated by `protect` + `authorize('admin')`.
 */
import { User, Badge, Contest, Submission, AiUsage } from '../models/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ------------------------------------------------------------------ */
export const listUsers = wrap(async (req, res) => {
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100))
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const filter = {}
  if (req.query.role) filter.role = req.query.role
  if (req.query.q) filter.$or = [
    { name: { $regex: String(req.query.q), $options: 'i' } },
    { email: { $regex: String(req.query.q), $options: 'i' } },
  ]
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ])
  res.json({ success: true, count: users.length, total, page, pages: Math.ceil(total / limit), data: users })
})

export const updateUserRole = wrap(async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) throw new ValidationError('role must be "user" or "admin"')
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { new: true, runValidators: true }
  ).select('-password')
  if (!user) throw new NotFoundError('User not found')
  res.json({ success: true, data: user })
})

export const disableUser = wrap(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isDisabled: true } },
    { new: true }
  ).select('-password')
  if (!user) throw new NotFoundError('User not found')
  res.json({ success: true, message: 'User disabled', data: user })
})

export const awardBadge = wrap(async (req, res) => {
  const { userId, badgeId } = req.body
  if (!userId || !badgeId) throw new ValidationError('userId and badgeId are required')
  const [user, badge] = await Promise.all([
    User.findById(userId),
    Badge.findById(badgeId),
  ])
  if (!user) throw new NotFoundError('User not found')
  if (!badge) throw new NotFoundError('Badge not found')
  if (user.badges.some((b) => b.id === badge.id)) {
    return res.json({ success: true, message: 'Badge already awarded' })
  }
  user.badges.push({ id: badge.id, name: badge.name, icon: badge.icon, earnedAt: new Date() })
  user.xp = (user.xp || 0) + (badge.xpReward || 0)
  await user.save()
  res.json({ success: true, data: user })
})

export const getStats = wrap(async (_req, res) => {
  const [users, contests, submissions, ai] = await Promise.all([
    User.countDocuments(),
    Contest.countDocuments(),
    Submission.countDocuments(),
    AiUsage.aggregate([{ $group: { _id: null, tokens: { $sum: '$totalTokens' } } }]),
  ])
  res.json({
    success: true,
    data: {
      users,
      contests,
      submissions,
      aiTokens: ai[0]?.tokens || 0,
    },
  })
})

export default { listUsers, updateUserRole, disableUser, awardBadge, getStats }
