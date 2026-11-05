import { api } from './api'

export const taskService = {
  /**
   * Fetch tasks with optional date, month, priority, or completion filters
   */
  async getTasks(params = {}) {
    const res = await api.get('/tasks', params)
    return res.data?.tasks || []
  },

  /**
   * Fetch a single task by ID
   */
  async getTaskById(id) {
    const res = await api.get(`/tasks/${id}`)
    return res.data?.task || null
  },

  /**
   * Create a new task
   */
  async createTask(taskData) {
    const res = await api.post('/tasks', taskData)
    return res.data?.task || null
  },

  /**
   * Update an existing task
   */
  async updateTask(id, updates) {
    const res = await api.patch(`/tasks/${id}`, updates)
    return res.data?.task || null
  },

  /**
   * Delete a task
   */
  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`)
    return res.data?.id || id
  },
}

export default taskService

