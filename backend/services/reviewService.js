import mongoose from 'mongoose'
import { DailyReview } from '../models/DailyReview.js'
import { isHistoricalDate } from '../utils/dateUtils.js'

/**
 * Service to handle daily review business logic and database operations.
 * Enforces one-review-per-user-per-date and user ownership.
 */
export const reviewService = {
  /**
   * Save or update a daily review for a specific date.
   * If a review exists for the user and date, it updates it while preserving createdAt.
   */
  async saveOrUpdateReview(userId, data, timezone = 'Asia/Kolkata') {
    if (isHistoricalDate(data.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    const filter = { userId, date: data.date }

    const updateDoc = {
      $set: {
        accomplishments: data.accomplishments ? data.accomplishments.trim() : '',
        improvements: data.improvements ? data.improvements.trim() : '',
        tomorrowFocus: data.tomorrowFocus ? data.tomorrowFocus.trim() : '',
        mood: data.mood,
      },
      $setOnInsert: {
        userId,
        date: data.date,
      },
    }

    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }

    const review = await DailyReview.findOneAndUpdate(filter, updateDoc, options)
    return review
  },

  /**
   * Query reviews for the authenticated user with validated date or month filters.
   * Completely safe against NoSQL query object injection.
   */
  async getReviews(userId, filters = {}) {
    const query = { userId }

    if (filters.date && typeof filters.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
      query.date = filters.date
    } else if (filters.month && typeof filters.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) {
      query.date = { $regex: `^${filters.month}` }
    } else if (
      filters.startDate &&
      filters.endDate &&
      typeof filters.startDate === 'string' &&
      typeof filters.endDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(filters.startDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)
    ) {
      query.date = { $gte: filters.startDate, $lte: filters.endDate }
    }

    const reviews = await DailyReview.find(query).sort({ date: -1 })
    return reviews
  },

  /**
   * Retrieve a specific review by ID enforcing user ownership.
   */
  async getReviewById(userId, reviewId) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return null
    const review = await DailyReview.findOne({ _id: reviewId, userId })
    return review
  },

  /**
   * Retrieve a specific review by date for the user.
   */
  async getReviewByDate(userId, date) {
    const review = await DailyReview.findOne({ userId, date })
    return review
  },

  /**
   * Update an existing review by ID enforcing user ownership and historical read-only rules.
   */
  async updateReview(userId, reviewId, updates, timezone = 'Asia/Kolkata') {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return null

    // Prevent modifying ownership or date conflict
    delete updates.userId
    delete updates._id
    delete updates.id
    delete updates.createdAt

    const review = await DailyReview.findOne({ _id: reviewId, userId })
    if (!review) return null

    // Historical records are read-only
    if (isHistoricalDate(review.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    // Cannot move review to a past date
    if (updates.date && isHistoricalDate(updates.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    // If updating date, verify user doesn't already have a review for the target date
    if (updates.date && updates.date !== review.date) {
      const existing = await DailyReview.findOne({
        userId,
        date: updates.date,
        _id: { $ne: reviewId },
      })
      if (existing) {
        const conflictErr = new Error('A review has already been submitted for this date.')
        conflictErr.statusCode = 409
        throw conflictErr
      }
      review.date = updates.date
    }

    if (updates.accomplishments !== undefined) review.accomplishments = updates.accomplishments.trim()
    if (updates.improvements !== undefined) review.improvements = updates.improvements.trim()
    if (updates.tomorrowFocus !== undefined) review.tomorrowFocus = updates.tomorrowFocus.trim()
    if (updates.mood !== undefined) review.mood = updates.mood

    await review.save()
    return review
  },

  /**
   * Delete a review enforcing user ownership and historical read-only rules.
   */
  async deleteReview(userId, reviewId, timezone = 'Asia/Kolkata') {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return null
    const review = await DailyReview.findOne({ _id: reviewId, userId })
    if (!review) return null

    // Historical records are read-only
    if (isHistoricalDate(review.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    await DailyReview.deleteOne({ _id: reviewId, userId })
    return review
  },
}

