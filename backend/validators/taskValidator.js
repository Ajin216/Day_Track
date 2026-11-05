const isValidDateString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [year, month, day] = str.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const validateCreateTask = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { title, date, priority, time } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { isValid: false, message: 'Task title is required.' }
  }

  if (title.trim().length > 200) {
    return { isValid: false, message: 'Task title cannot exceed 200 characters.' }
  }

  if (!date || !isValidDateString(date)) {
    return { isValid: false, message: 'A valid date (YYYY-MM-DD) is required.' }
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return { isValid: false, message: 'Priority must be low, medium, or high.' }
  }

  if (time !== null && time !== undefined && time !== '') {
    if (typeof time !== 'string' || !timeRegex.test(time.trim())) {
      return { isValid: false, message: 'Time must be in 24-hour HH:mm format, or null.' }
    }
  }

  return { isValid: true }
}

export const validateUpdateTask = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { title, date, priority, time, completed } = body

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return { isValid: false, message: 'Task title cannot be empty.' }
    }
    if (title.trim().length > 200) {
      return { isValid: false, message: 'Task title cannot exceed 200 characters.' }
    }
  }

  if (date !== undefined && !isValidDateString(date)) {
    return { isValid: false, message: 'Date must be a valid calendar date in YYYY-MM-DD format.' }
  }

  if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
    return { isValid: false, message: 'Priority must be low, medium, or high.' }
  }

  if (time !== null && time !== undefined && time !== '') {
    if (typeof time !== 'string' || !timeRegex.test(time.trim())) {
      return { isValid: false, message: 'Time must be in 24-hour HH:mm format, or null.' }
    }
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return { isValid: false, message: 'Completed must be a boolean value.' }
  }

  return { isValid: true }
}

