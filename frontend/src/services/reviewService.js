import { api } from './api'

export const reviewService = {
  /**
   * Fetch daily reviews with optional date or month filter
   */
  async getReviews(params = {}) {
    const res = await api.get('/reviews', params)
    return res.data?.reviews || []
  },

  /**
   * Fetch a single review by ID
   */
  async getReviewById(id) {
    const res = await api.get(`/reviews/${id}`)
    return res.data?.review || null
  },

  /**
   * Save or update a daily review for a specific date (upsert)
   */
  async saveOrUpdateReview(reviewData) {
    const res = await api.post('/reviews', reviewData)
    return res.data?.review || null
  },

  /**
   * Update an existing daily review
   */
  async updateReview(id, updates) {
    const res = await api.patch(`/reviews/${id}`, updates)
    return res.data?.review || null
  },

  /**
   * Delete a daily review
   */
  async deleteReview(id) {
    const res = await api.delete(`/reviews/${id}`)
    return res.data?.id || id
  },
}

export default reviewService

