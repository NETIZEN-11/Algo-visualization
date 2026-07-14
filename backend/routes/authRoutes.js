import express from 'express'
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  validate,
} from '../middleware/validation.js'
import { authRateLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Public — rate limited strictly
router.post('/register', authRateLimiter, registerValidation, validate, register)
router.post('/login', authRateLimiter, loginValidation, validate, login)
router.post('/refresh', refresh)
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword)
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, resetPassword)
// GET (from email link) and POST (programmatic) both work
router.get('/verify-email', verifyEmailValidation, validate, verifyEmail)
router.post('/verify-email', verifyEmailValidation, validate, verifyEmail)

// Protected
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfileValidation, validate, updateProfile)
router.post('/change-password', protect, changePasswordValidation, validate, changePassword)
router.post('/logout', protect, logout)
router.post('/logout-all', protect, logoutAll)
router.post('/resend-verification', protect, resendVerification)
router.delete('/account', protect, deleteAccount)

export default router
