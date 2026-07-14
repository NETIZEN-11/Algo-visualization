/**
 * Level math — single source of truth.
 *
 *   level(xp)    — current level for a given XP total
 *   xpToLevel(n) — total XP required to reach level n (1-indexed)
 *   xpToNext(xp) — XP remaining until the next level-up
 *
 * Tuned for an 8-level curve with a quadratic feel: each new tier
 * costs ~50% more than the previous one. At level 8 the user is
 * comfortably an "expert" (4000 XP, ~200 medium problems).
 */
export const USER_LEVELS = [
  { level: 1, minXP: 0, title: 'Novice' },
  { level: 2, minXP: 100, title: 'Apprentice' },
  { level: 3, minXP: 300, title: 'Practitioner' },
  { level: 4, minXP: 600, title: 'Skilled' },
  { level: 5, minXP: 1000, title: 'Proficient' },
  { level: 6, minXP: 1500, title: 'Advanced' },
  { level: 7, minXP: 2500, title: 'Expert' },
  { level: 8, minXP: 4000, title: 'Master' },
]

export const xpToLevel = (level) => {
  if (level <= 1) return 0
  const row = USER_LEVELS.find((r) => r.level === level)
  return row ? row.minXP : USER_LEVELS[USER_LEVELS.length - 1].minXP
}

export const calculateLevel = (xp) => {
  let current = 1
  for (const row of USER_LEVELS) {
    if (xp >= row.minXP) current = row.level
  }
  return current
}

export const xpToNextLevel = (xp) => {
  const lvl = calculateLevel(xp)
  if (lvl >= USER_LEVELS.length) return 0
  return USER_LEVELS[lvl].minXP - xp
}

/** Streak counter — increments on consecutive calendar days (UTC). */
export const calculateStreak = (currentStreak, lastActive, now = new Date()) => {
  if (!lastActive) return 1
  // Compare in UTC to avoid timezone-dependent day boundaries.
  // Use Date.UTC to extract the calendar day; both last and now are
  // normalised to midnight UTC of their respective dates.
  const a = Date.UTC(
    new Date(lastActive).getUTCFullYear(),
    new Date(lastActive).getUTCMonth(),
    new Date(lastActive).getUTCDate()
  )
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const days = Math.round((b - a) / 86_400_000)
  if (days === 0) return Math.max(1, currentStreak || 1)
  if (days === 1) return (currentStreak || 0) + 1
  return 1
}

/**
 * Add XP to a user. Updates `xp`, `level`, `streak`, and pushes an entry
 * into `activityLog`. Persists and returns the updated user, or `null`
 * on error.
 */
export const addXP = async (userId, amount, activity) => {
  try {
    // Import lazily to avoid a circular import (User model → addXP → User)
    const { default: User } = await import('../models/User.js')
    const user = await User.findById(userId)
    if (!user) return null

    user.xp = (user.xp || 0) + (amount || 0)
    user.level = calculateLevel(user.xp)
    user.streak = calculateStreak(user.streak, user.lastActive, new Date())
    user.lastActive = new Date()
    user.activityLog = user.activityLog || []
    user.activityLog.push({ activity: String(activity || ''), xp: amount || 0, date: new Date() })
    // Cap activity log to last 200 entries to keep the document small
    if (user.activityLog.length > 200) {
      user.activityLog = user.activityLog.slice(-200)
    }
    await user.save()
    return user
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('addXP failed:', err.message)
    return null
  }
}
