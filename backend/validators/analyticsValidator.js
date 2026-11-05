/**
 * Validates date string in YYYY-MM-DD format with calendar accuracy
 */
export const isValidDateString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [year, month, day] = str.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

/**
 * Validates month string in YYYY-MM format with calendar accuracy
 */
export const isValidMonthString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) return false
  const [year, month] = str.split('-').map(Number)
  return year >= 1970 && year <= 2100 && month >= 1 && month <= 12
}

/**
 * Validates query parameters for GET /api/analytics/overview
 */
export const validateOverviewQuery = (query = {}) => {
  if (query.date && !isValidDateString(query.date)) {
    return { isValid: false, message: 'Invalid date parameter. Must be in YYYY-MM-DD format.' }
  }

  if (query.today && !isValidDateString(query.today)) {
    return { isValid: false, message: 'Invalid today parameter. Must be in YYYY-MM-DD format.' }
  }

  return { isValid: true }
}

/**
 * Validates query parameters for GET /api/analytics/weekly
 */
export const validateWeeklyQuery = (query = {}) => {
  if (query.date && !isValidDateString(query.date)) {
    return { isValid: false, message: 'Invalid date parameter. Must be in YYYY-MM-DD format.' }
  }

  if (query.startDate && !isValidDateString(query.startDate)) {
    return { isValid: false, message: 'Invalid startDate parameter. Must be in YYYY-MM-DD format.' }
  }

  if (query.endDate && !isValidDateString(query.endDate)) {
    return { isValid: false, message: 'Invalid endDate parameter. Must be in YYYY-MM-DD format.' }
  }

  if (query.startDate && query.endDate) {
    if (query.startDate > query.endDate) {
      return { isValid: false, message: 'startDate cannot be after endDate.' }
    }

    // Limit maximum window to 31 days to avoid unbounded aggregation
    const [y1, m1, d1] = query.startDate.split('-').map(Number)
    const [y2, m2, d2] = query.endDate.split('-').map(Number)
    const t1 = Date.UTC(y1, m1 - 1, d1)
    const t2 = Date.UTC(y2, m2 - 1, d2)
    const diffDays = Math.round((t2 - t1) / (24 * 60 * 60 * 1000))
    if (diffDays > 31) {
      return { isValid: false, message: 'Date range cannot exceed 31 days.' }
    }
  }

  return { isValid: true }
}

/**
 * Validates query parameters for GET /api/analytics/monthly
 */
export const validateMonthlyQuery = (query = {}) => {
  if (query.month && !isValidMonthString(query.month)) {
    return { isValid: false, message: 'Invalid month parameter. Must be in YYYY-MM format.' }
  }

  if (query.date && !isValidDateString(query.date)) {
    return { isValid: false, message: 'Invalid date parameter. Must be in YYYY-MM-DD format.' }
  }

  return { isValid: true }
}

