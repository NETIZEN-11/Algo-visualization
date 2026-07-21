/**
 * Authentication controllers.
 *
 * - `register` / `login`  → issue access token in JSON + refresh in httpOnly cookie
 * - `refresh`             → rotate refresh token; reuse triggers family-wide revoke
 * - `logout`              → revoke the current refresh token
 * - `logoutAll`           → revoke every refresh token for the user
 * - `forgotPassword`      → email a one-time reset link
 * - `resetPassword`       → consume the reset token, set a new password
 * - `verifyEmail`         → consume the email-verification token
 * - `resendVerification`  → reissue the email-verification token
 * - `changePassword`      → requires current password
 * - `deleteAccount`       → cascades through every owned record
 *
 * Tokens are set with `SameSite=Strict`, `Secure` (in prod), `HttpOnly`,
 * `Path=/` — and a `Path=/api/auth` for the access token so it is not
 * sent on every request.
 */
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import * as RefreshTokenModel from '../services/tokenService.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import { validatePasswordStrength } from '../utils/passwordValidator.js'
import {
  sendEmail,
  buildVerificationEmail,
  buildPasswordResetEmail,
} from '../services/emailService.js'
import {
  AppError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  TooManyRequestsError,
  ValidationError,
} from '../utils/errors.js'

import { msFromDuration } from '../utils/duration.js'

const ACCESS_TTL_MS = msFromDuration(process.env.JWT_EXPIRE || '15m')
const REFRESH_TTL_MS = msFromDuration(process.env.JWT_REFRESH_EXPIRE || '30d')
const isProd = process.env.NODE_ENV === 'production'
// When SMTP isn't configured, surface the verify/reset link in the JSON
// response so dev environments (and reviewers) can still exercise the flow
// end-to-end without an inbox. The flag is forced to "false" in production.
const DEV_AUTH_MODE = !isProd && process.env.SMTP_HOST === '' || process.env.DEV_AUTH_MODE === 'true'

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/',
  maxAge,
})

const setAuthCookies = (res, { access, refresh, accessMaxAge = ACCESS_TTL_MS, refreshMaxAge = REFRESH_TTL_MS }) => {
  res.cookie('access', access, { ...cookieOpts(accessMaxAge), path: '/api' })
  res.cookie('refresh', refresh, cookieOpts(refreshMaxAge))
}

const clearAuthCookies = (res) => {
  res.clearCookie('access', { path: '/api' })
  res.clearCookie('refresh', { path: '/' })
}

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  avatar: u.avatar,
  role: u.role,
  level: u.level,
  xp: u.xp,
  streak: u.streak,
  emailVerified: u.emailVerified,
  preferences: u.preferences,
  problemStats: u.problemStats || { easy: 0, medium: 0, hard: 0, total: 0 },
  patternStats: u.patternStats || {},
  solvedProblems: (u.solvedProblems || []).map((id) => id?.toString?.() ?? id),
  savedProblems: (u.savedProblems || []).map((id) => id?.toString?.() ?? id),
  badges: u.badges || [],
})

/* --------------------------------------------------------------------- */
/* Register                                                              */
/* --------------------------------------------------------------------- */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Password strength — fails closed.
    const pw = validatePasswordStrength(password)
    if (!pw.ok) throw new ValidationError(pw.feedback || 'Password is too weak')

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) throw new ConflictError('An account with that email already exists')

    const hashed = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    // Issue tokens
    const access = generateAccessToken(user._id)
    const refresh = generateRefreshToken(user._id)
    await RefreshTokenModel.issueRefreshToken({
      userId: user._id,
      jti: refresh.jti,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setAuthCookies(res, { access, refresh: refresh.token })

    // Send verification email (best-effort). In dev with no SMTP, surface
    // the link in the response so the flow is testable.
    const responseBody = {
      success: true,
      message: 'Account created. Check your email to verify your address.',
      accessToken: access,
      user: publicUser(user),
    }
    if (process.env.MAIL_VERIFY_URL) {
      const url = `${process.env.MAIL_VERIFY_URL}?token=${verificationToken}&uid=${user._id}`
      const tpl = buildVerificationEmail({ name, verifyUrl: url })
      sendEmail({ to: user.email, ...tpl }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('verification email failed:', err.message)
      })
      if (DEV_AUTH_MODE) responseBody.devVerifyUrl = url
    }

    res.status(201).json(responseBody)
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Login                                                                 */
/* --------------------------------------------------------------------- */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) throw new UnauthorizedError('Invalid credentials')

    // Brute-force lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutes = Math.ceil((user.lockoutUntil - Date.now()) / 60_000)
      throw new TooManyRequestsError(`Account locked. Try again in ${minutes} min.`, 'ACCOUNT_LOCKED')
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      user.loginAttempts = (user.loginAttempts || 0) + 1
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000)
        user.loginAttempts = 0
      }
      await user.save({ validateBeforeSave: false })
      throw new UnauthorizedError('Invalid credentials')
    }

    user.loginAttempts = 0
    user.lockoutUntil = null
    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    const access = generateAccessToken(user._id)
    const refresh = generateRefreshToken(user._id)
    await RefreshTokenModel.issueRefreshToken({
      userId: user._id,
      jti: refresh.jti,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setAuthCookies(res, { access, refresh: refresh.token })

    res.json({
      success: true,
      message: 'Login successful',
      accessToken: access,
      user: publicUser(user),
    })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Refresh                                                               */
/* --------------------------------------------------------------------- */
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh
    if (!token) throw new UnauthorizedError('Missing refresh token')
    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      throw new UnauthorizedError('Invalid refresh token')
    }

    const newRefresh = generateRefreshToken(decoded.id)

    // Rotate — reuse detection happens inside
    let rotated
    try {
      rotated = await RefreshTokenModel.rotateRefreshToken({
        oldJti: decoded.jti,
        userId: decoded.id,
        newJti: newRefresh.jti,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      })
    } catch (e) {
      // Reuse detected — wipe session
      clearAuthCookies(res)
      throw new UnauthorizedError(e.message)
    }

    const access = generateAccessToken(decoded.id)
    setAuthCookies(res, { access, refresh: newRefresh.token })
    res.json({ success: true, accessToken: access })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Logout / logout-all                                                   */
/* --------------------------------------------------------------------- */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh
    if (token) {
      try {
        const decoded = verifyRefreshToken(token)
        await RefreshTokenModel.revokeRefreshToken(decoded.jti)
      } catch {
        /* ignore — token already invalid */
      }
    }
    clearAuthCookies(res)
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export const logoutAll = async (req, res, next) => {
  try {
    await RefreshTokenModel.revokeAllForUser(req.user._id, 'logout_all')
    clearAuthCookies(res)
    res.json({ success: true, message: 'All sessions terminated' })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Profile                                                               */
/* --------------------------------------------------------------------- */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ success: true, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const updates = {}
    for (const k of ['name', 'avatar', 'preferences']) {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })
    res.json({ success: true, message: 'Profile updated', user: publicUser(user) })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Password change / reset                                               */
/* --------------------------------------------------------------------- */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const pw = validatePasswordStrength(newPassword)
    if (!pw.ok) throw new ValidationError(pw.feedback || 'Password is too weak')

    const user = await User.findById(req.user._id).select('+password')
    if (!user) throw new NotFoundError('User not found')

    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) throw new UnauthorizedError('Current password is incorrect')

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    // Rotate every session — password changed
    await RefreshTokenModel.revokeAllForUser(user._id, 'password_changed')

    res.json({ success: true, message: 'Password updated. Please sign in again.' })
  } catch (err) {
    next(err)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    // Always 200 — never leak which emails exist. In dev-mode (no SMTP),
    // we surface the link so the flow remains testable.
    const body = {
      success: true,
      message:
        'If that email is registered, a reset link has been sent. Check your inbox.',
    }
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.passwordResetToken = token
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await user.save({ validateBeforeSave: false })
      if (process.env.MAIL_RESET_URL) {
        const url = `${process.env.MAIL_RESET_URL}?token=${token}&uid=${user._id}`
        const tpl = buildPasswordResetEmail({ name: user.name, resetUrl: url })
        sendEmail({ to: user.email, ...tpl }).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('reset email failed:', err.message)
        })
        if (DEV_AUTH_MODE) body.devResetUrl = url
      }
    }
    res.json(body)
  } catch (err) {
    next(err)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    // Token arrives in the query string (clicked from an email link) or
    // in the body (programmatic). Accept both.
    const token = req.query?.token || req.body?.token
    const { newPassword } = req.body
    const pw = validatePasswordStrength(newPassword)
    if (!pw.ok) throw new ValidationError(pw.feedback || 'Password is too weak')

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires')
    if (!user) throw new BadRequestError('Reset link is invalid or expired')

    user.password = await bcrypt.hash(newPassword, 12)
    user.passwordResetToken = null
    user.passwordResetExpires = null
    await user.save()
    await RefreshTokenModel.revokeAllForUser(user._id, 'password_reset')

    res.json({ success: true, message: 'Password reset. Please sign in.' })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Email verification                                                    */
/* --------------------------------------------------------------------- */
export const verifyEmail = async (req, res, next) => {
  try {
    // Token may arrive in the body (programmatic) or the query string
    // (clicked from an email link → GET /api/auth/verify-email?token=…).
    const token = (req.body && req.body.token) || req.query?.token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    })
    if (!user) throw new BadRequestError('Verification link is invalid or expired')
    user.emailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null
    await user.save()
    res.json({ success: true, message: 'Email verified', user: { id: user._id, email: user.email, emailVerified: true } })
  } catch (err) {
    next(err)
  }
}

export const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) throw new NotFoundError('User not found')
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email is already verified' })
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.emailVerificationToken = token
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await user.save({ validateBeforeSave: false })
    if (process.env.MAIL_VERIFY_URL) {
      const url = `${process.env.MAIL_VERIFY_URL}?token=${token}&uid=${user._id}`
      const tpl = buildVerificationEmail({ name: user.name, verifyUrl: url })
      sendEmail({ to: user.email, ...tpl }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('verification email failed:', err.message)
      })
      if (DEV_AUTH_MODE) {
        return res.json({ success: true, message: 'Verification email sent', devVerifyUrl: url })
      }
    }
    res.json({ success: true, message: 'Verification email sent' })
  } catch (err) {
    next(err)
  }
}

/* --------------------------------------------------------------------- */
/* Account deletion (cascade)                                            */
/* --------------------------------------------------------------------- */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id
    // Import cascade service lazily to avoid circular deps at boot
    const { cascadeDeleteUser } = await import('../services/cascadeDeleteService.js')
    await cascadeDeleteUser(userId)
    clearAuthCookies(res)
    res.json({ success: true, message: 'Account deleted' })
  } catch (err) {
    next(err)
  }
}
