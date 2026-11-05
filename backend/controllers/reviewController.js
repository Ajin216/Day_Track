import { reviewService } from '../services/reviewService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * @desc    Create or update a daily review for the authenticated user and date
 * @route   POST /api/reviews
 * @access  Private
 */
export const saveReview = asyncHandler(async (req, res) => {
  const review = await reviewService.saveOrUpdateReview(req.user._id, req.body, req.user?.timezone)

  res.status(200).json({
    success: true,
    message: 'Daily review saved successfully',
    data: { review },
  })
})

/**
 * @desc    Get all daily reviews for the authenticated user
 * @route   GET /api/reviews
 * @access  Private
 */
export const getReviews = asyncHandler(async (req, res) => {
  const { date, month, startDate, endDate } = req.query

  const reviews = await reviewService.getReviews(req.user._id, {
    date,
    month,
    startDate,
    endDate,
  })

  res.status(200).json({
    success: true,
    message: 'Daily reviews retrieved successfully',
    data: {
      count: reviews.length,
      reviews,
    },
  })
})

/**
 * @desc    Get a single review by ID
 * @route   GET /api/reviews/:id
 * @access  Private
 */
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.user._id, req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Daily review not found or you do not have permission to access it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Daily review retrieved successfully',
    data: { review },
  })
})

/**
 * @desc    Update an existing daily review
 * @route   PATCH /api/reviews/:id
 * @access  Private
 */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(
    req.user._id,
    req.params.id,
    req.body,
    req.user?.timezone
  )

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Daily review not found or you do not have permission to update it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Daily review updated successfully',
    data: { review },
  })
})

/**
 * @desc    Delete a daily review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await reviewService.deleteReview(req.user._id, req.params.id, req.user?.timezone)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Daily review not found or you do not have permission to delete it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Daily review deleted successfully',
    data: { id: req.params.id },
  })
})

