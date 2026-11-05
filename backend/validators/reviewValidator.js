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

const VALID_MOODS = ['Excellent', 'Good', 'Okay', 'Bad', 'Terrible']

export const validateReview = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { date, mood, accomplishments, improvements, tomorrowFocus } = body

  if (!date || !isValidDateString(date)) {
    return { isValid: false, message: 'A valid review date (YYYY-MM-DD) is required.' }
  }

  if (!mood || !VALID_MOODS.includes(mood)) {
    return {
      isValid: false,
      message: 'Mood is required and must be one of: Excellent, Good, Okay, Bad, Terrible.',
    }
  }

  if (accomplishments !== undefined && typeof accomplishments !== 'string') {
    return { isValid: false, message: 'Accomplishments must be a string.' }
  }

  if (improvements !== undefined && typeof improvements !== 'string') {
    return { isValid: false, message: 'Improvements must be a string.' }
  }

  if (tomorrowFocus !== undefined && typeof tomorrowFocus !== 'string') {
    return { isValid: false, message: 'Tomorrow focus must be a string.' }
  }

  return { isValid: true }
}

export const validateUpdateReview = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { date, mood } = body

  if (date !== undefined && !isValidDateString(date)) {
    return { isValid: false, message: 'A valid review date (YYYY-MM-DD) is required.' }
  }

  if (mood !== undefined && !VALID_MOODS.includes(mood)) {
    return {
      isValid: false,
      message: 'Mood must be one of: Excellent, Good, Okay, Bad, Terrible.',
    }
  }

  return { isValid: true }
}

