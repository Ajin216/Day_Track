/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { format, isValid } from 'date-fns'
import { useAuth } from './AuthContext'
import {
  isValidDateString,
  getTodayStringInTimezone,
  getMillisecondsUntilMidnight,
  getLocalTodayString,
} from '../utils/dateUtils'

export {
  isValidDateString,
  getTodayStringInTimezone,
  getMillisecondsUntilMidnight,
  getLocalTodayString,
}

const SelectedDateContext = createContext(undefined)

export function SelectedDateProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'

  // Dynamic today state based on user's timezone
  const [today, setToday] = useState(() => getTodayStringInTimezone(userTimezone))

  // Selected date state: always initializes to current local date on application load
  const [selectedDate, setSelectedDateState] = useState(() => getTodayStringInTimezone(userTimezone))

  // When user logs in or authenticates, automatically select the current local date
  const [prevUserId, setPrevUserId] = useState(user?.id)
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id)
    if (isAuthenticated) {
      const currentToday = getTodayStringInTimezone(userTimezone)
      setToday(currentToday)
      setSelectedDateState(currentToday)
    }
  }

  // Synchronize date at midnight and handle tab visibility/focus/overnight transitions
  useEffect(() => {
    let midnightTimer = null
    let intervalTimer = null

    const syncDateTransition = () => {
      const currentToday = getTodayStringInTimezone(userTimezone)
      setToday((prevToday) => {
        if (prevToday !== currentToday) {
          // Date transition occurred: automatically advance selectedDate to new today
          setSelectedDateState(currentToday)
          return currentToday
        }
        return prevToday
      })
    }

    const scheduleMidnightCheck = () => {
      if (midnightTimer) clearTimeout(midnightTimer)
      const ms = getMillisecondsUntilMidnight(userTimezone)
      midnightTimer = setTimeout(() => {
        syncDateTransition()
        scheduleMidnightCheck()
      }, ms)
    }

    // Schedule exact midnight timer
    scheduleMidnightCheck()

    // 30-second periodic safeguard for clock skew or system background throttling
    intervalTimer = setInterval(syncDateTransition, 30000)

    // Wake-up check: recalculate current date when tab becomes visible or receives focus
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncDateTransition()
        scheduleMidnightCheck()
      }
    }

    document.addEventListener('visibilitychange', handleFocusOrVisibility)
    window.addEventListener('focus', handleFocusOrVisibility)

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer)
      if (intervalTimer) clearInterval(intervalTimer)
      document.removeEventListener('visibilitychange', handleFocusOrVisibility)
      window.removeEventListener('focus', handleFocusOrVisibility)
    }
  }, [userTimezone])

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
