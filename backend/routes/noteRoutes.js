import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { aiRateLimiter, globalRateLimiter } from '../middleware/rateLimiter.js'
import { validate, noteValidation, noteUpdateValidation } from '../middleware/validation.js'
import {
  createNote, getNote, listNotes, updateNote, deleteNote, togglePin,
} from '../controllers/noteController.js'

const router = Router()

router.use(protect, globalRateLimiter, aiRateLimiter)

router.get('/', listNotes)
router.get('/:id', getNote)
router.post('/', noteValidation, validate, createNote)
router.put('/:id', noteUpdateValidation, validate, updateNote)
router.delete('/:id', deleteNote)
router.post('/:id/pin', togglePin)

export default router
