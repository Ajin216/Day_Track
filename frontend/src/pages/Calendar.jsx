import { useState, useCallback } from 'react'
import { parse, addMonths, subMonths, format, isValid } from 'date-fns'
import { useSelectedDate } from '../context/SelectedDateContext'
import CalendarHeader from '../components/calendar/CalendarHeader'
import MonthlyCalendar from '../components/calendar/MonthlyCalendar'
import SelectedDatePanel from '../components/calendar/SelectedDatePanel'

export default function Calendar() {
  const { selectedDate, setSelectedDate, today, isToday } = useSelectedDate()

  // Track the month currently viewed in the calendar
  // Initialized to the month of the currently selected date
  const [viewDate, setViewDate] = useState(() => {
    return parse(selectedDate, 'yyyy-MM-dd', new Date())
  })

  // Synchronize calendar view month when selectedDate transitions into a new month
  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate)
  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate)
    const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
    if (isValid(parsed) && format(viewDate, 'yyyy-MM') !== format(parsed, 'yyyy-MM')) {
      setViewDate(parsed)
    }
  }

  const handlePrevMonth = useCallback(() => {
    setViewDate((prev) => subMonths(prev, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => addMonths(prev, 1))
  }, [])

  const handleToday = useCallback(() => {
    const todayDate = new Date()
    setSelectedDate(today)
    setViewDate(todayDate)
  }, [setSelectedDate, today])

  const handleSelectDate = useCallback(
    (day) => {
      const dateString = format(day, 'yyyy-MM-dd')
      setSelectedDate(dateString)
    },
    [setSelectedDate],
  )

  return (
    <div className="space-y-6">
      {/* Calendar Header with navigation controls and selected date summary */}
      <CalendarHeader
        viewDate={viewDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        selectedDate={selectedDate}
        isToday={isToday}
      />

      {/* Main Responsive Layout: Monthly Calendar Grid alongside Contextual Selected-Date Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Interactive Calendar Grid (8 cols on xl, 7 on lg) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <MonthlyCalendar
            viewDate={viewDate}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={handleSelectDate}
          />
        </div>

        {/* Contextual Selected-Date Panel (4 cols on xl, 5 on lg, sticky on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
          <SelectedDatePanel onJumpToday={handleToday} />
        </div>
      </div>
    </div>
  )
}
