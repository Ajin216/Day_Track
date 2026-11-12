import { format, parse, isValid } from 'date-fns'

/**
 * Checks whether a given string is a valid strictly-formatted YYYY-MM-DD date.
 */
export const isValidDateString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false
  }
  const parsed = parse(str, 'yyyy-MM-dd', new Date())
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === str
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the given timezone.
 * Falls back to local system timezone or Asia/Kolkata if timezone formatting fails.
 */
export const getTodayStringInTimezone = (timezone) => {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch (err) {
    console.warn('Timezone calculation error, falling back to local date:', err)
    return format(new Date(), 'yyyy-MM-dd')
  }
}

/**
 * Calculates exact milliseconds remaining until midnight (00:00:00) in the given timezone.
 * Adds a small 500ms safety margin to guarantee the clock crosses into the new date.
 */
export const getMillisecondsUntilMidnight = (timezone) => {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
    })
    const parts = formatter.formatToParts(new Date())
    const map = {}
    for (const p of parts) {
      map[p.type] = p.value
    }
    const hour = parseInt(map.hour, 10) || 0
    const minute = parseInt(map.minute, 10) || 0
    const second = parseInt(map.second, 10) || 0
    const millisecond = parseInt(map.fractionalSecond || '0', 10) || 0

    const elapsedMs = (hour * 3600 + minute * 60 + second) * 1000 + millisecond
    const msUntilMidnight = 86400000 - elapsedMs
    return Math.max(msUntilMidnight + 500, 1000)
  } catch (err) {
    console.warn('Error calculating ms until midnight, falling back to local Date:', err)
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 500)
    return Math.max(midnight.getTime() - now.getTime(), 1000)
  }
}

/**
 * Returns today's local date in YYYY-MM-DD format (legacy helper).
 */
export const getLocalTodayString = () => {
  return format(new Date(), 'yyyy-MM-dd')
}

