import { taskService } from '../services/taskService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * @desc    Create a new task for the authenticated user
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body, req.user?.timezone)

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  })
})

/**
 * @desc    Get all tasks belonging to the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { date, month, startDate, endDate, completed, priority, category } = req.query

  const tasks = await taskService.getTasks(req.user._id, {
    date,
    month,
    startDate,
    endDate,
    completed,
    priority,
    category,
  })

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: {
      count: tasks.length,
      tasks,
    },
  })
})

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user._id, req.params.id)

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found or you do not have permission to access it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: { task },
  })
})

/**
 * @desc    Update an existing task
 * @route   PATCH /api/tasks/:id
 * @access  Private
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user._id, req.params.id, req.body, req.user?.timezone)

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found or you do not have permission to update it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  })
})

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.user._id, req.params.id, req.user?.timezone)

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found or you do not have permission to delete it.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
    data: { id: req.params.id },
  })
})

