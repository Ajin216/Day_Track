import { Router } from 'express'
import {
  saveReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import {
  validateReview,
  validateUpdateReview,
} from '../validators/reviewValidator.js'

const router = Router()

// All review routes require authentication
router.use(protect)

router.route('/')
  .post(validate(validateReview), saveReview)
  .get(getReviews)

router.route('/:id')
  .get(getReviewById)
  .patch(validate(validateUpdateReview), updateReview)
  .delete(deleteReview)

export default router

