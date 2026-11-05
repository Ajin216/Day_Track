import { goalService } from '../services/goalService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * @desc    Create a new monthly goal
 * @route   POST /api/goals
 * @access  Private
 */
export const createGoal = asyncHandler(async (req, res) => {
  try {
    const goal = await goalService.createGoal(req.user._id, req.body)

    res.status(201).json({
      success: true,
      message: 'Monthly goal created successfully',
      data: { goal },
    })
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        data: { existingGoal: err.existingGoal },
      })
    }
    throw err
  }
})

/**
 * @desc    Get active goal for a month (defaults to current month if omitted)
 * @route   GET /api/goals/active
 * @access  Private
 */
export const getActiveGoal = asyncHandler(async (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const month = req.query.month || currentMonth

  const goal = await goalService.getActiveGoal(req.user._id, month)

  res.status(200).json({
    success: true,
    message: goal
      ? 'Active monthly goal retrieved successfully'
      : 'No goal found for this month',
    data: { goal },
  })
})

/**
 * @desc    Get all monthly goals for the user
 * @route   GET /api/goals
 * @access  Private
 */
export const getGoals = asyncHandler(async (req, res) => {
  const { month, status } = req.query

  const goals = await goalService.getGoals(req.user._id, { month, status })

  res.status(200).json({
    success: true,
    message: 'Monthly goals retrieved successfully',
    data: {
      count: goals.length,
      goals,
    },
  })
})

/**
 * @desc    Get a single monthly goal by ID
 * @route   GET /api/goals/:id
 * @access  Private
 */
export const getGoalById = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.user._id, req.params.id)

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Monthly goal not found or you do not have permission to access it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Monthly goal retrieved successfully',
    data: { goal },
  })
})

/**
 * @desc    Update a monthly goal
 * @route   PATCH /api/goals/:id
 * @access  Private
 */
export const updateGoal = asyncHandler(async (req, res) => {
  try {
    const goal = await goalService.updateGoal(req.user._id, req.params.id, req.body)

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Monthly goal not found or you do not have permission to update it.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Monthly goal updated successfully',
      data: { goal },
    })
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
      })
    }
    throw err
  }
})

/**
 * @desc    Mark a monthly goal as completed
 * @route   PATCH /api/goals/:id/complete
 * @access  Private
 */
export const completeGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.completeGoal(req.user._id, req.params.id)

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Monthly goal not found or you do not have permission to complete it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Monthly goal marked as completed successfully',
    data: { goal },
  })
})

/**
 * @desc    Delete a monthly goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
export const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.deleteGoal(req.user._id, req.params.id)

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Monthly goal not found or you do not have permission to delete it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Monthly goal deleted successfully',
    data: { id: req.params.id },
  })
})

/**
 * @desc    Get user achievements (completed monthly goals)
 * @route   GET /api/goals/achievements
 * @access  Private
 */
export const getAchievements = asyncHandler(async (req, res) => {
  const result = await goalService.getAchievements(req.user._id, req.query)

  res.status(200).json({
    success: true,
    message: 'Achievements retrieved successfully',
    data: result,
  })
})

