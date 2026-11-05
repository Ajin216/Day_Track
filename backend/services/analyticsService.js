import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { DailyReview } from '../models/DailyReview.js'

/**
 * Date arithmetic helper to add or subtract days in UTC, immune to timezone shifts.
 */
export const addDaysToDateString = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/**
 * Returns the Monday (start of week) for a given date in YYYY-MM-DD format.
 */
export const getMondayOfWeek = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = dt.getUTCDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  return addDaysToDateString(dateStr, diffToMonday)
}

/**
 * Returns total days in a month for a given year and month.
 */
export const getDaysInMonth = (year, month) => {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Returns weekday names (short and full) for a date string.
 */
export const getWeekdayName = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return {
    short: daysShort[dt.getUTCDay()],
    full: daysFull[dt.getUTCDay()],
  }
}

/**
 * Returns current date string formatted as YYYY-MM-DD in the user's timezone.
 */
export const getTodayString = (timezone = 'Asia/Kolkata') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/**
 * Calculates current and longest productivity streaks based on consecutive calendar days
 * with at least one completed task.
 */
export const calculateStreaks = (completedDatesSet, referenceDate) => {
  let currentStreak = 0

  // 1. Current Streak Calculation
  // A streak is active if today has a completed task, or if yesterday had a completed task (today in progress).
  if (completedDatesSet.has(referenceDate)) {
    currentStreak = 1
    let checkDate = addDaysToDateString(referenceDate, -1)
    while (completedDatesSet.has(checkDate)) {
      currentStreak++
      checkDate = addDaysToDateString(checkDate, -1)
    }
  } else {
    const yesterday = addDaysToDateString(referenceDate, -1)
    if (completedDatesSet.has(yesterday)) {
      currentStreak = 1
      let checkDate = addDaysToDateString(yesterday, -1)
      while (completedDatesSet.has(checkDate)) {
        currentStreak++
        checkDate = addDaysToDateString(checkDate, -1)
      }
    } else {
      currentStreak = 0
    }
  }

  // 2. Longest Streak Calculation across all historical completed dates
  let longestStreak = 0
  const sortedDates = Array.from(completedDatesSet).sort()
  if (sortedDates.length > 0) {
    let tempStreak = 1
    longestStreak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1]
      const currDate = sortedDates[i]
      if (addDaysToDateString(prevDate, 1) === currDate) {
        tempStreak++
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
      } else {
        tempStreak = 1
      }
    }
  }

  return { currentStreak, longestStreak }
}

export const analyticsService = {
  /**
   * GET /api/analytics/overview
   * Returns lifetime task counts, completion percentage, active streak, and total reviews.
   */
  async getOverview(userId, options = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // 1. Aggregate lifetime task statistics in a single pipeline
    const [taskStats] = await Task.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] },
          },
        },
      },
    ])

    const totalTasks = taskStats?.totalTasks || 0
    const completedTasks = taskStats?.completedTasks || 0
    const pendingTasks = taskStats?.pendingTasks || 0
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0

    // 2. Aggregate distinct dates with completed tasks for streak calculation
    const completedDays = await Task.aggregate([
      {
        $match: {
          userId: userObjectId,
          completed: true,
        },
      },
      {
        $group: {
          _id: '$date',
        },
      },
      {
        $sort: { _id: -1 },
      },
    ])

    const completedDatesSet = new Set(completedDays.map((d) => d._id))
    const referenceDate =
      options.date || options.today || getTodayString(options.timezone)

    const { currentStreak, longestStreak } = calculateStreaks(
      completedDatesSet,
      referenceDate
    )

    // 3. Count total daily reviews for the user
    const totalReviews = await DailyReview.countDocuments({ userId: userObjectId })

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionPercentage,
      currentStreak,
      longestStreak,
      totalReviews,
      referenceDate,
    }
  },

  /**
   * GET /api/analytics/weekly
   * Returns a 7-day activity window with daily counts, completion %, and totals.
   */
  async getWeekly(userId, options = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    let rangeStart
    let rangeEnd

    if (options.startDate) {
      rangeStart = options.startDate
      rangeEnd = options.endDate || addDaysToDateString(rangeStart, 6)
    } else if (options.date) {
      rangeStart = getMondayOfWeek(options.date)
      rangeEnd = addDaysToDateString(rangeStart, 6)
    } else {
      const today = getTodayString(options.timezone)
      rangeStart = getMondayOfWeek(today)
      rangeEnd = addDaysToDateString(rangeStart, 6)
    }

    // Single aggregation query for the date range
    const dailyStats = await Task.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: '$date',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] },
          },
        },
      },
    ])

    const statsMap = new Map()
    for (const item of dailyStats) {
      statsMap.set(item._id, item)
    }

    // Build the ordered 7-day array
    const days = []
    let curDate = rangeStart
    let totalWeeklyTasks = 0
    let completedWeeklyTasks = 0
    let pendingWeeklyTasks = 0
    let activeDaysCount = 0
    let productiveDaysCount = 0

    while (curDate <= rangeEnd) {
      const stat = statsMap.get(curDate)
      const dayTotal = stat?.totalTasks || 0
      const dayCompleted = stat?.completedTasks || 0
      const dayPending = stat?.pendingTasks || 0

      // Empty days must not count as zero-productivity days in averages
      const dayRate =
        dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 1000) / 10 : null

      totalWeeklyTasks += dayTotal
      completedWeeklyTasks += dayCompleted
      pendingWeeklyTasks += dayPending

      if (dayTotal > 0) activeDaysCount++
      if (dayCompleted > 0) productiveDaysCount++

      const weekday = getWeekdayName(curDate)

      days.push({
        date: curDate,
        day: weekday.short,
        dayOfWeek: weekday.full,
        totalTasks: dayTotal,
        completedTasks: dayCompleted,
        pendingTasks: dayPending,
        completionPercentage: dayRate,
        // Aliases for chart components
        total: dayTotal,
        completed: dayCompleted,
        pending: dayPending,
        hasTasks: dayTotal > 0,
      })

      curDate = addDaysToDateString(curDate, 1)
    }

    const weekCompletionPercentage =
      totalWeeklyTasks > 0
        ? Math.round((completedWeeklyTasks / totalWeeklyTasks) * 1000) / 10
        : 0

    return {
      startDate: rangeStart,
      endDate: rangeEnd,
      totalTasks: totalWeeklyTasks,
      completedTasks: completedWeeklyTasks,
      pendingTasks: pendingWeeklyTasks,
      completionPercentage: weekCompletionPercentage,
      activeDaysCount,
      productiveDaysCount,
      days,
    }
  },

  /**
   * GET /api/analytics/monthly
   * Returns monthly totals, daily task completion breakdown, priority and category distributions.
   */
  async getMonthly(userId, options = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    let targetMonth
    if (options.month) {
      targetMonth = options.month
    } else if (options.date) {
      targetMonth = options.date.slice(0, 7)
    } else {
      targetMonth = getTodayString(options.timezone).slice(0, 7)
    }

    const [year, monthNum] = targetMonth.split('-').map(Number)
    const daysInMonth = getDaysInMonth(year, monthNum)

    // Execute efficient multi-faceted aggregation pipeline
    const [monthStats] = await Task.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $regex: `^${targetMonth}` },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
                },
                pendingTasks: {
                  $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] },
                },
              },
            },
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
                },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                total: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
                },
                pending: {
                  $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] },
                },
              },
            },
            { $sort: { total: -1 } },
          ],
          dailyBreakdown: [
            {
              $group: {
                _id: '$date',
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
                },
                pendingTasks: {
                  $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ])

    const summary = monthStats?.summary?.[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    }

    const totalTasks = summary.totalTasks
    const completedTasks = summary.completedTasks
    const pendingTasks = summary.pendingTasks
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0

    // Priority Distribution
    const priorityCounts = { low: 0, medium: 0, high: 0 }
    const priorityCompleted = { low: 0, medium: 0, high: 0 }

    if (monthStats?.byPriority) {
      for (const p of monthStats.byPriority) {
        if (p._id && priorityCounts[p._id] !== undefined) {
          priorityCounts[p._id] = p.count
          priorityCompleted[p._id] = p.completed
        }
      }
    }

    const priorityPercentages = {
      low: totalTasks > 0 ? Math.round((priorityCounts.low / totalTasks) * 1000) / 10 : 0,
      medium: totalTasks > 0 ? Math.round((priorityCounts.medium / totalTasks) * 1000) / 10 : 0,
      high: totalTasks > 0 ? Math.round((priorityCounts.high / totalTasks) * 1000) / 10 : 0,
    }

    const priorityBreakdown = [
      {
        priority: 'high',
        count: priorityCounts.high,
        completed: priorityCompleted.high,
        percentage: priorityPercentages.high,
      },
      {
        priority: 'medium',
        count: priorityCounts.medium,
        completed: priorityCompleted.medium,
        percentage: priorityPercentages.medium,
      },
      {
        priority: 'low',
        count: priorityCounts.low,
        completed: priorityCompleted.low,
        percentage: priorityPercentages.low,
      },
    ]

    // Category Distribution
    const categoryDistribution = (monthStats?.byCategory || []).map((cat) => {
      const catTotal = cat.total
      const catCompleted = cat.completed
      const catPending = cat.pending
      const catPercentage =
        totalTasks > 0 ? Math.round((catTotal / totalTasks) * 1000) / 10 : 0
      const catCompletionRate =
        catTotal > 0 ? Math.round((catCompleted / catTotal) * 1000) / 10 : 0

      return {
        category: cat._id || 'General',
        total: catTotal,
        completed: catCompleted,
        pending: catPending,
        percentage: catPercentage,
        completionPercentage: catCompletionRate,
      }
    })

    // Daily Task Completion Breakdown for all days in the month
    const dailyMap = new Map()
    if (monthStats?.dailyBreakdown) {
      for (const item of monthStats.dailyBreakdown) {
        dailyMap.set(item._id, item)
      }
    }

    const dailyBreakdown = []
    let daysWithCompletedTasks = 0

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayStr = String(dayNum).padStart(2, '0')
      const dateKey = `${targetMonth}-${dayStr}`
      const stat = dailyMap.get(dateKey)

      const dayTotal = stat?.totalTasks || 0
      const dayCompleted = stat?.completedTasks || 0
      const dayPending = stat?.pendingTasks || 0

      const dayRate =
        dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 1000) / 10 : null

      if (dayCompleted > 0) {
        daysWithCompletedTasks++
      }

      const weekday = getWeekdayName(dateKey)

      dailyBreakdown.push({
        date: dateKey,
        dayOfMonth: dayNum,
        day: weekday.short,
        dayOfWeek: weekday.full,
        totalTasks: dayTotal,
        completedTasks: dayCompleted,
        pendingTasks: dayPending,
        completionPercentage: dayRate,
        hasTasks: dayTotal > 0,
      })
    }

    return {
      month: targetMonth,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionPercentage,
      daysWithCompletedTasks,
      priorityDistribution: {
        counts: priorityCounts,
        percentages: priorityPercentages,
        breakdown: priorityBreakdown,
      },
      categoryDistribution,
      dailyBreakdown,
    }
  },
}

