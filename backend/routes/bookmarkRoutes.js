import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getBookmarks, getBookmark, addBookmark, removeBookmark,
} from '../controllers/bookmarkController.js'

const router = express.Router()

// All bookmark routes require authentication
router.use(protect)

router.get('/', getBookmarks)
router.get('/:algorithmId', getBookmark)
router.post('/', addBookmark)
router.delete('/:algorithmId', removeBookmark)

export default router
