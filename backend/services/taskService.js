import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { isHistoricalDate } from '../utils/dateUtils.js'

/**
 * Service to handle task business logic and database queries.
 * Enforces ownership on every query using userId.
 */
export const taskService = {
  /**
   * Create a new task belonging to the authenticated user.
   */
  async createTask(userId, data, timezone = 'Asia/Kolkata') {
    if (isHistoricalDate(data.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    const task = await Task.create({
      userId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      date: data.date,
      priority: data.priority || 'medium',
      category: data.category ? data.category.trim() : 'General',
      time: data.time && data.time.trim() ? data.time.trim() : null,
      completed: Boolean(data.completed),
      completedAt: data.completed ? new Date() : null,
    })

    return task
  },

  /**
   * Query user's tasks with sanitized and validated date, month, or status filters.
   * Completely safe against NoSQL query object injection.
   */
  async getTasks(userId, filters = {}) {
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

    if (filters.completed !== undefined) {
      query.completed = filters.completed === 'true' || filters.completed === true
    }

    if (filters.priority && typeof filters.priority === 'string' && ['low', 'medium', 'high'].includes(filters.priority)) {
      query.priority = filters.priority
    }

    if (filters.category && typeof filters.category === 'string') {
      query.category = filters.category.slice(0, 50)
    }

    const tasks = await Task.find(query).sort({ date: 1, createdAt: -1 })
    return tasks
  },

  /**
   * Retrieve a specific task enforcing ownership.
   */
  async getTaskById(userId, taskId) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) return null
    const task = await Task.findOne({ _id: taskId, userId })
    return task
  },

  /**
   * Update an existing task enforcing ownership and historical read-only rules.
   * Manages completion timestamps and prevents modification of userId.
   */
  async updateTask(userId, taskId, updates, timezone = 'Asia/Kolkata') {
    if (!mongoose.Types.ObjectId.isValid(taskId)) return null
    const task = await Task.findOne({ _id: taskId, userId })
    if (!task) return null

    // Historical records are read-only
    if (isHistoricalDate(task.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    // Cannot reschedule to a past date
    if (updates.date && isHistoricalDate(updates.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    // Prevent modifying task ownership
    delete updates.userId
    delete updates._id
    delete updates.id

    if (updates.title !== undefined) task.title = updates.title.trim()
    if (updates.description !== undefined) task.description = updates.description.trim()
    if (updates.date !== undefined) task.date = updates.date
    if (updates.priority !== undefined) task.priority = updates.priority
    if (updates.category !== undefined) task.category = updates.category.trim() || 'General'
    if (updates.time !== undefined) task.time = updates.time ? updates.time.trim() : null

    // Manage completion timestamp rules
    if (updates.completed !== undefined) {
      const isCompleted = Boolean(updates.completed)
      if (isCompleted && !task.completed) {
        task.completedAt = new Date()
      } else if (!isCompleted) {
        task.completedAt = null
      }
      task.completed = isCompleted
    }

    await task.save()
    return task
  },

  /**
   * Delete a task enforcing ownership and historical read-only rules.
   */
  async deleteTask(userId, taskId, timezone = 'Asia/Kolkata') {
    if (!mongoose.Types.ObjectId.isValid(taskId)) return null
    const task = await Task.findOne({ _id: taskId, userId })
    if (!task) return null

    // Historical records are read-only
    if (isHistoricalDate(task.date, timezone)) {
      const error = new Error('Historical records for past dates are read-only and cannot be created, modified, or deleted.')
      error.statusCode = 403
      throw error
    }

    await Task.deleteOne({ _id: taskId, userId })
    return task
  },
}

