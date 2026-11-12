import { useState, useCallback } from 'react'
import { parse, addMonths, subMonths, format, isValid } from 'date-fns'
import { useSelectedDate } from '../context/SelectedDateContext'
import CalendarHeader from '../components/calendar/CalendarHeader'
import MonthlyCalendar from '../components/calendar/MonthlyCalendar'
import SelectedDateModal from '../components/calendar/SelectedDateModal'

export default function Calendar() {
  const { selectedDate, setSelectedDate, today, isToday } = useSelectedDate()
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setIsModalOpen(true)
    },
    [setSelectedDate],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

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

      {/* Monthly Interactive Calendar Grid (Full Width) */}
      <MonthlyCalendar
        viewDate={viewDate}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={handleSelectDate}
      />

      {/* Contextual Modal for Selected Date */}
      <SelectedDateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
