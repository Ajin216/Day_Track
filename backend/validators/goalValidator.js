const isValidMonthString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) return false
  const [year, month] = str.split('-').map(Number)
  return year >= 1970 && year <= 2100 && month >= 1 && month <= 12
}

export const validateCreateGoal = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { title, month, description, target, progress, status } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { isValid: false, message: 'Goal title is required.' }
  }

  if (title.trim().length > 200) {
    return { isValid: false, message: 'Goal title cannot exceed 200 characters.' }
  }

  if (!month || !isValidMonthString(month)) {
    return { isValid: false, message: 'A valid month in YYYY-MM format is required.' }
  }

  if (description !== undefined && typeof description !== 'string') {
    return { isValid: false, message: 'Description must be a string.' }
  }

  if (description && description.trim().length > 1000) {
    return { isValid: false, message: 'Description cannot exceed 1000 characters.' }
  }

  if (target !== undefined && typeof target !== 'string') {
    return { isValid: false, message: 'Target milestone must be a string.' }
  }

  if (target && target.trim().length > 500) {
    return { isValid: false, message: 'Target milestone cannot exceed 500 characters.' }
  }

  if (progress !== undefined) {
    const p = Number(progress)
    if (isNaN(p) || p < 0 || p > 100) {
      return { isValid: false, message: 'Progress percentage must be a number between 0 and 100.' }
    }
  }

  if (status !== undefined && !['in_progress', 'completed'].includes(status)) {
    return { isValid: false, message: 'Status must be in_progress or completed.' }
  }

  return { isValid: true }
}

export const validateUpdateGoal = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { title, month, description, target, progress, status } = body

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return { isValid: false, message: 'Goal title cannot be empty.' }
    }
    if (title.trim().length > 200) {
      return { isValid: false, message: 'Goal title cannot exceed 200 characters.' }
    }
  }

  if (month !== undefined && !isValidMonthString(month)) {
    return { isValid: false, message: 'Month must be in YYYY-MM format.' }
  }

  if (description !== undefined && typeof description !== 'string') {
    return { isValid: false, message: 'Description must be a string.' }
  }

  if (description && description.trim().length > 1000) {
    return { isValid: false, message: 'Description cannot exceed 1000 characters.' }
  }

  if (target !== undefined && typeof target !== 'string') {
    return { isValid: false, message: 'Target milestone must be a string.' }
  }

  if (target && target.trim().length > 500) {
    return { isValid: false, message: 'Target milestone cannot exceed 500 characters.' }
  }

  if (progress !== undefined) {
    const p = Number(progress)
    if (isNaN(p) || p < 0 || p > 100) {
      return { isValid: false, message: 'Progress percentage must be a number between 0 and 100.' }
    }
  }

  if (status !== undefined && !['in_progress', 'completed'].includes(status)) {
    return { isValid: false, message: 'Status must be in_progress or completed.' }
  }

  return { isValid: true }
}

export const validateGoalQuery = (query = {}) => {
  if (query.month && !isValidMonthString(query.month)) {
    return { isValid: false, message: 'Invalid month parameter. Must be in YYYY-MM format.' }
  }
  return { isValid: true }
}

export const validateAchievementsQuery = (query = {}) => {
  if (query.month && !isValidMonthString(query.month)) {
    return { isValid: false, message: 'Invalid month parameter. Must be in YYYY-MM format.' }
  }
  if (query.year && !/^\d{4}$/.test(query.year)) {
    return { isValid: false, message: 'Invalid year parameter. Must be a 4-digit year (YYYY).' }
  }
  if (query.page !== undefined) {
    const p = Number(query.page)
    if (!Number.isInteger(p) || p < 1) {
      return { isValid: false, message: 'Page must be a positive integer.' }
    }
  }
  if (query.limit !== undefined) {
    const l = Number(query.limit)
    if (!Number.isInteger(l) || l < 1 || l > 100) {
      return { isValid: false, message: 'Limit must be an integer between 1 and 100.' }
    }
  }
  return { isValid: true }
}

