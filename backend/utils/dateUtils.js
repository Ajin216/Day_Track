/**
 * Date utility helpers for user-timezone-aware date calculations.
 */

/**
 * Returns today's date string (YYYY-MM-DD) formatted in the given timezone.
 * Defaults to 'Asia/Kolkata'.
 */
export const getTodayInTimezone = (timezone = 'Asia/Kolkata') => {
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
 * Checks whether a given YYYY-MM-DD date string is strictly prior to today in the specified timezone.
 * Returns true if dateStr < todayInTimezone, false otherwise.
 */
export const isHistoricalDate = (dateStr, timezone = 'Asia/Kolkata') => {
  if (!dateStr || typeof dateStr !== 'string') return false
  const todayStr = getTodayInTimezone(timezone)
  return dateStr < todayStr
}

