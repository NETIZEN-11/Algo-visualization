import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { list, getBySlug, listProblems } from '../controllers/companyController.js'

const router = Router()

router.get('/', optionalAuth, list)
router.get('/:slug', optionalAuth, getBySlug)
router.get('/:slug/problems', optionalAuth, listProblems)

export default router
