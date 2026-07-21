import express from 'express'
import {
  getFlashcards,
  generateFlashcards,
  reviewFlashcard,
  createFlashcard,
  deleteFlashcard,
} from '../controllers/flashcardController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getFlashcards)
router.post('/generate', generateFlashcards)
router.post('/review/:id', reviewFlashcard)
router.post('/', createFlashcard)
router.delete('/:id', deleteFlashcard)

export default router
