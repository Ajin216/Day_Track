/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { format, parse, isValid } from 'date-fns'
import { useAuth } from './AuthContext'

const SelectedDateContext = createContext(undefined)

const STORAGE_KEY = 'daytrack_selected_date'

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
 * Falls back to local system date if timezone formatting fails.
 */
export const getTodayStringInTimezone = (timezone = 'Asia/Kolkata') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
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
 * Returns today's local date in YYYY-MM-DD format (legacy helper).
 */
export const getLocalTodayString = () => {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SelectedDateProvider({ children }) {
  const { user } = useAuth()
  const userTimezone = user?.timezone || 'Asia/Kolkata'

  // Compute today dynamically using user's configured timezone
  const today = useMemo(() => {
    return getTodayStringInTimezone(userTimezone)
  }, [userTimezone])

  const [selectedDate, setSelectedDateState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && isValidDateString(saved)) {
        return saved
      }
    } catch (e) {
      console.warn('Unable to read selected date from localStorage:', e)
    }
    // Default to today's date in user's timezone
    return getTodayStringInTimezone(userTimezone)
  })

  // Persist selected date to localStorage
  useEffect(() => {
    try {
      if (isValidDateString(selectedDate)) {
        localStorage.setItem(STORAGE_KEY, selectedDate)
      }
    } catch (e) {
      console.warn('Unable to persist selected date to localStorage:', e)
    }
  }, [selectedDate])

  const setSelectedDate = useCallback((newDate) => {
    let dateStr = ''
    if (newDate instanceof Date) {
      if (isValid(newDate)) {
        dateStr = format(newDate, 'yyyy-MM-dd')
      }
    } else if (typeof newDate === 'string') {
      dateStr = newDate.trim()
    }

    if (isValidDateString(dateStr)) {
      setSelectedDateState(dateStr)
    } else {
      console.warn('Attempted to set invalid date:', newDate)
    }
  }, [])

  const isToday = selectedDate === today
  const isHistorical = selectedDate < today
  const isFuture = selectedDate > today

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      today,
      isToday,
      isHistorical,
      isFuture,
      userTimezone,
    }),
    [selectedDate, setSelectedDate, today, isToday, isHistorical, isFuture, userTimezone],
  )

  return (
    <SelectedDateContext.Provider value={value}>
      {children}
    </SelectedDateContext.Provider>
  )
}

export function useSelectedDate() {
  const context = useContext(SelectedDateContext)
  if (!context) {
    throw new Error('useSelectedDate must be used within a SelectedDateProvider')
  }
  return context
}
