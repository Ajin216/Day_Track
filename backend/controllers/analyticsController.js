import { analyticsService } from '../services/analyticsService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * @desc    Get high-level productivity overview (lifetime tasks, streak, reviews)
 * @route   GET /api/analytics/overview
 * @access  Private
 */
export const getOverview = asyncHandler(async (req, res) => {
  const { date, today } = req.query
  const timezone = req.user.timezone || 'Asia/Kolkata'

  const overview = await analyticsService.getOverview(req.user._id, {
    date,
    today,
    timezone,
  })

  res.status(200).json({
    success: true,
    message: 'Overview analytics retrieved successfully',
    data: overview,
  })
})

/**
 * @desc    Get 7-day weekly task velocity and daily activity
 * @route   GET /api/analytics/weekly
 * @access  Private
 */
export const getWeekly = asyncHandler(async (req, res) => {
  const { date, startDate, endDate } = req.query
  const timezone = req.user.timezone || 'Asia/Kolkata'

  const weekly = await analyticsService.getWeekly(req.user._id, {
    date,
    startDate,
    endDate,
    timezone,
  })

  res.status(200).json({
    success: true,
    message: 'Weekly analytics retrieved successfully',
    data: weekly,
  })
})

/**
 * @desc    Get monthly analytics breakdown, priority and category distributions
 * @route   GET /api/analytics/monthly
 * @access  Private
 */
export const getMonthly = asyncHandler(async (req, res) => {
  const { month, date } = req.query
  const timezone = req.user.timezone || 'Asia/Kolkata'

  const monthly = await analyticsService.getMonthly(req.user._id, {
    month,
    date,
    timezone,
  })

  res.status(200).json({
    success: true,
    message: 'Monthly analytics retrieved successfully',
    data: monthly,
  })
})

