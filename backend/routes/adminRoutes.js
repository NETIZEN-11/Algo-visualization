/**
 * Admin routes — `/api/admin`
 *
 * Every endpoint requires `protect` (any logged-in user) AND
 * `authorize('admin')` (only admins). Non-admins get 403.
 */
import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { globalRateLimiter } from '../middleware/rateLimiter.js'
import {
  listUsers, updateUserRole, disableUser, awardBadge, getStats,
} from '../controllers/adminController.js'

const router = Router()

router.use(protect, authorize('admin'), globalRateLimiter)

router.get('/users', listUsers)
router.put('/users/:id/role', updateUserRole)
router.post('/users/:id/disable', disableUser)
router.post('/badges/award', awardBadge)
router.get('/stats', getStats)

export default router
