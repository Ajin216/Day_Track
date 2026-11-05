import { api } from './api'

/**
 * Frontend Analytics Service
 * Connects to DayTrack backend analytics endpoints
 */
export const analyticsService = {
  /**
   * Retrieve high-level productivity overview (lifetime tasks, streak, reviews)
   * @param {Object} params - { date, today }
   * @returns {Promise<Object>}
   */
  async getOverview(params = {}) {
    const res = await api.get('/analytics/overview', params)
    return res.data || null
  },

  /**
   * Retrieve 7-day weekly task activity and velocity
   * @param {Object} params - { date, startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getWeeklyAnalytics(params = {}) {
    const res = await api.get('/analytics/weekly', params)
    return res.data || null
  },

  /**
   * Retrieve monthly task breakdown, priority and category distributions
   * @param {Object} params - { month, date }
   * @returns {Promise<Object>}
   */
  async getMonthlyAnalytics(params = {}) {
    const res = await api.get('/analytics/monthly', params)
    return res.data || null
  },
}

export default analyticsService

