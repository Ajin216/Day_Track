import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parse, addMonths, subMonths, format, isValid } from 'date-fns'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react'
import { useSelectedDate } from '../context/SelectedDateContext'
import CalendarHeader from '../components/calendar/CalendarHeader'
import MonthlyCalendar from '../components/calendar/MonthlyCalendar'

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

  const formattedSelected = useMemo(() => {
    const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
    return format(parsed, 'EEEE, MMMM d, yyyy')
  }, [selectedDate])

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

      {/* Monthly Interactive Calendar Grid */}
      <MonthlyCalendar
        viewDate={viewDate}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={handleSelectDate}
      />

      {/* Selected Date Actions / Hub Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Active Context Date
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {formattedSelected}
            </div>
          </div>
        </div>

        {/* Quick jump to date-aware pages */}
        <div className="flex items-center flex-wrap gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Dashboard
          </Link>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            My Tasks
          </Link>
          <Link
            to="/journal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Daily Journal
          </Link>
        </div>
      </div>

      {/* Informational Guidance */}
      <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p>
          Selecting any date syncs across your Dashboard, My Tasks, and Daily Journal. In Step 4+, each day will dynamically reflect scheduled time-blocks and prioritized task completion records.
        </p>
      </div>
    </div>
  )
}
