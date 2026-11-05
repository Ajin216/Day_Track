import mongoose from 'mongoose'
import { MonthlyGoal } from '../models/MonthlyGoal.js'

export const goalService = {
  /**
   * Create a new monthly goal.
   * If an active goal already exists for the month, requires data.replace === true
   * to mark the previous active goal completed/archived and preserve history.
   */
  async createGoal(userId, data) {
    const month = data.month

    // Check for existing active goal for this user and month
    const existingActive = await MonthlyGoal.findOne({
      userId,
      month,
      status: 'in_progress',
    })

    if (existingActive) {
      if (data.replace === true) {
        // Mark previous active goal as completed to preserve history
        existingActive.status = 'completed'
        existingActive.completedAt = existingActive.completedAt || new Date()
        await existingActive.save()
      } else {
        const conflictErr = new Error(
          'An active monthly goal already exists for this month. Confirm replacement to set a new goal.'
        )
        conflictErr.statusCode = 409
        conflictErr.existingGoal = existingActive
        throw conflictErr
      }
    }

    const progress = Math.min(100, Math.max(0, Number(data.progress) || 0))
    const isCompleted = data.status === 'completed' || progress === 100

    const goal = await MonthlyGoal.create({
      userId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      target: data.target ? data.target.trim() : '',
      progress,
      month,
      status: isCompleted ? 'completed' : 'in_progress',
      completedAt: isCompleted ? new Date() : null,
    })

    return goal
  },

  /**
   * Retrieve the active goal for a specific month.
   * If no in_progress goal exists, falls back to the most recently completed goal for that month.
   */
  async getActiveGoal(userId, month) {
    // 1. Try finding in_progress goal first
    let goal = await MonthlyGoal.findOne({
      userId,
      month,
      status: 'in_progress',
    })

    // 2. If no active in-progress goal, find most recently completed goal for this month
    if (!goal) {
      goal = await MonthlyGoal.findOne({
        userId,
        month,
        status: 'completed',
      }).sort({ updatedAt: -1 })
    }

    return goal
  },

  /**
   * Get all goals for the user, with optional month filter.
   */
  async getGoals(userId, filters = {}) {
    const query = { userId }

    if (filters.month && typeof filters.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) {
      query.month = filters.month
    }

    if (filters.status && ['in_progress', 'completed'].includes(filters.status)) {
      query.status = filters.status
    }

    const goals = await MonthlyGoal.find(query).sort({ month: -1, createdAt: -1 })
    return goals
  },

  /**
   * Retrieve a specific goal by ID with ownership enforcement.
   */
  async getGoalById(userId, goalId) {
    if (!mongoose.Types.ObjectId.isValid(goalId)) return null
    const goal = await MonthlyGoal.findOne({ _id: goalId, userId })
    return goal
  },

  /**
   * Update an existing goal with ownership enforcement.
   */
  async updateGoal(userId, goalId, updates) {
    if (!mongoose.Types.ObjectId.isValid(goalId)) return null

    const goal = await MonthlyGoal.findOne({ _id: goalId, userId })
    if (!goal) return null

    // Prevent modifying ownership, internal IDs, or completion timestamp
    delete updates.userId
    delete updates._id
    delete updates.id
    delete updates.completedAt

    if (updates.title !== undefined) goal.title = updates.title.trim()
    if (updates.description !== undefined) goal.description = updates.description.trim()
    if (updates.target !== undefined) goal.target = updates.target.trim()
    if (updates.month !== undefined) goal.month = updates.month

    if (updates.progress !== undefined) {
      const p = Math.min(100, Math.max(0, Number(updates.progress)))
      goal.progress = p

      // If progress reaches 100%, automatically mark as completed
      if (p === 100 && goal.status !== 'completed') {
        goal.status = 'completed'
        goal.completedAt = new Date()
      }
    }

    if (updates.status !== undefined) {
      if (updates.status === 'in_progress' && goal.status === 'completed') {
        // Verify user doesn't already have another in_progress goal for this month
        const otherActive = await MonthlyGoal.findOne({
          userId,
          month: goal.month,
          status: 'in_progress',
          _id: { $ne: goal._id },
        })

        if (otherActive) {
          const conflictErr = new Error(
            'Cannot reactivate this goal because another active goal already exists for this month.'
          )
          conflictErr.statusCode = 409
          throw conflictErr
        }

        goal.status = 'in_progress'
        goal.completedAt = null
      } else if (updates.status === 'completed' && goal.status !== 'completed') {
        goal.status = 'completed'
        goal.completedAt = new Date()
        if (goal.progress < 100) {
          goal.progress = 100
        }
      }
    }

    await goal.save()
    return goal
  },

  /**
   * Complete a goal directly.
   */
  async completeGoal(userId, goalId) {
    if (!mongoose.Types.ObjectId.isValid(goalId)) return null

    const goal = await MonthlyGoal.findOne({ _id: goalId, userId })
    if (!goal) return null

    goal.status = 'completed'
    goal.progress = 100
    goal.completedAt = new Date()

    await goal.save()
    return goal
  },

  /**
   * Delete a goal with ownership enforcement.
   */
  async deleteGoal(userId, goalId) {
    if (!mongoose.Types.ObjectId.isValid(goalId)) return null
    const goal = await MonthlyGoal.findOneAndDelete({ _id: goalId, userId })
    return goal
  },

  /**
   * Retrieve all completed goals (achievements) for the authenticated user,
   * supporting optional year/month filtering, pagination, and summary statistics.
   */
  async getAchievements(userId, filters = {}) {
    const filter = {
      userId,
      status: 'completed',
    }

    if (filters.month && typeof filters.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) {
      filter.month = filters.month
    } else if (filters.year && typeof filters.year === 'string' && /^\d{4}$/.test(filters.year)) {
      filter.month = new RegExp(`^${filters.year}-`)
    }

    const totalCount = await MonthlyGoal.countDocuments(filter)

    const page = Math.max(1, parseInt(filters.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20))
    const skip = (page - 1) * limit

    const achievements = await MonthlyGoal.find(filter)
      .sort({ completedAt: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Compute user-wide achievement statistics across all completed goals
    const allCompleted = await MonthlyGoal.find({ userId, status: 'completed' }, 'month completedAt')
    const totalCompleted = allCompleted.length
    const uniqueMonths = new Set(allCompleted.map((g) => g.month))
    const monthsCount = uniqueMonths.size

    // Available years with completed goals
    const yearsSet = new Set(allCompleted.map((g) => g.month.slice(0, 4)))
    const availableYears = Array.from(yearsSet).sort().reverse()

    return {
      achievements,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        totalCompleted,
        monthsCount,
        availableYears,
      },
    }
  },
}

