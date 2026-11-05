import { api } from './api'

export const goalService = {
  /**
   * Fetch the active goal for a specific month (defaults to current month)
   * @param {string} [month] - Month in YYYY-MM format
   */
  async getActiveGoal(month) {
    const params = month ? { month } : {}
    const res = await api.get('/goals/active', params)
    return res.data?.goal || null
  },

  /**
   * Fetch all goals for the user, with optional month and status filters
   * @param {Object} [params]
   * @param {string} [params.month] - Month in YYYY-MM format
   * @param {'in_progress'|'completed'} [params.status]
   */
  async getGoals(params = {}) {
    const res = await api.get('/goals', params)
    return res.data?.goals || []
  },

  /**
   * Fetch a single goal by its ID
   * @param {string} id
   */
  async getGoalById(id) {
    const res = await api.get(`/goals/${id}`)
    return res.data?.goal || null
  },

  /**
   * Create a new monthly goal
   * @param {Object} goalData
   * @param {string} goalData.title
   * @param {string} [goalData.description]
   * @param {string} [goalData.target]
   * @param {number} [goalData.progress]
   * @param {string} [goalData.month]
   * @param {boolean} [goalData.replace]
   */
  async createGoal(goalData) {
    const res = await api.post('/goals', goalData)
    return res.data?.goal || null
  },

  /**
   * Update an existing goal
   * @param {string} id
   * @param {Object} updates
   */
  async updateGoal(id, updates) {
    const res = await api.patch(`/goals/${id}`, updates)
    return res.data?.goal || null
  },

  /**
   * Mark a goal as completed
   * @param {string} id
   */
  async completeGoal(id) {
    const res = await api.patch(`/goals/${id}/complete`)
    return res.data?.goal || null
  },

  /**
   * Delete a goal
   * @param {string} id
   */
  async deleteGoal(id) {
    const res = await api.delete(`/goals/${id}`)
    return res.data?.id || id
  },

  /**
   * Fetch user achievements (completed monthly goals) with optional year, month, page, limit
   * @param {Object} [params]
   * @param {string} [params.year] - YYYY
   * @param {string} [params.month] - YYYY-MM
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  async getAchievements(params = {}) {
    const res = await api.get('/goals/achievements', params)
    return res.data || { achievements: [], stats: {}, pagination: {} }
  },
}

export default goalService

