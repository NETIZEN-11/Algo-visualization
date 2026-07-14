/**
 * Refresh-token store + rotation + revocation.
 *
 * Refresh tokens carry a `jti` (JWT ID). We persist a per-jti record in
 * Mongo so we can:
 *   - detect reuse of a rotated token (indicates token theft)
 *   - revoke a single session on logout
 *   - revoke every session on `logoutAll` / password change / account delete
 *
 * Rotation rule: each call to `rotate` returns a brand new refresh token
 * and immediately marks the old `jti` as replaced. If the old `jti` is
 * presented again, we treat it as a compromise and revoke the whole
 * family (cascade revocation).
 */
import crypto from 'node:crypto'
import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    family: { type: String, required: true, index: true },
    replacedBy: { type: String, default: null },
    revoked: { type: Boolean, default: false, index: true },
    revokedReason: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
)

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)

/** Issue a new refresh token, optionally as part of an existing family. */
export const issueRefreshToken = async ({ userId, jti, family, userAgent, ip }) => {
  const tokenJti = jti || crypto.randomUUID()
  const tokenExpiresAt = new Date(
    Date.now() + msFromDuration(process.env.JWT_REFRESH_EXPIRE || '30d')
  )
  await RefreshToken.create({
    jti: tokenJti,
    userId,
    family: family || crypto.randomUUID(),
    userAgent: userAgent?.slice(0, 256) || null,
    ip: ip || null,
    expiresAt: tokenExpiresAt,
  })
  return { jti: tokenJti, family: family || null, expiresAt: tokenExpiresAt }
}

/**
 * Validate and rotate a refresh token. Returns the new refresh token.
 * If a rotated token is replayed, the entire family is revoked and an
 * error is thrown.
 */
export const rotateRefreshToken = async ({ oldJti, userId, newJti, userAgent, ip }) => {
  const old = await RefreshToken.findOne({ jti: oldJti, userId })
  if (!old) throw new Error('Refresh token not recognised')
  if (old.revoked) {
    // Token theft suspected — burn the family.
    await RefreshToken.updateMany(
      { family: old.family, revoked: false },
      { $set: { revoked: true, revokedReason: 'reuse_detected' } }
    )
    throw new Error('Refresh token reuse detected; all sessions revoked')
  }
  const tokenJti = newJti || crypto.randomUUID()
  const { jti: createdJti, expiresAt } = await issueRefreshToken({
    userId,
    jti: tokenJti,
    family: old.family,
    userAgent,
    ip,
  })
  old.replacedBy = createdJti
  old.revoked = true
  old.revokedReason = 'rotated'
  await old.save()
  return { jti: createdJti, family: old.family, expiresAt }
}

export const revokeRefreshToken = async (jti) => {
  await RefreshToken.updateOne(
    { jti, revoked: false },
    { $set: { revoked: true, revokedReason: 'logout' } }
  )
}

export const revokeAllForUser = async (userId, reason = 'logout_all') => {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true, revokedReason: reason } }
  )
}

export const revokeFamily = async (family, reason = 'compromise') => {
  await RefreshToken.updateMany(
    { family, revoked: false },
    { $set: { revoked: true, revokedReason: reason } }
  )
}

function msFromDuration(s) {
  // Parse simple "<n>d" / "<n>h" / "<n>m" forms. Falls back to ms.
  const m = /^(\d+)([smhd])$/.exec(String(s).trim())
  if (!m) return Number(s) || 30 * 24 * 60 * 60 * 1000
  const n = Number(m[1])
  const unit = m[2]
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]
  return n * mult
}
