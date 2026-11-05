import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parse,
} from 'date-fns'
import { useTasks } from '../../context/TaskContext'
import { useDailyReview } from '../../context/DailyReviewContext'

const WEEKDAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
]

export default function MonthlyCalendar({
  viewDate,
  selectedDate,
  today,
  onSelectDate,
}) {
  const { tasks } = useTasks()
  const { reviews } = useDailyReview()

  const parsedSelectedDate = useMemo(() => {
    return parse(selectedDate, 'yyyy-MM-dd', new Date())
  }, [selectedDate])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    // Week starts on Monday (1)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [viewDate])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-3 sm:p-5 transition-colors">
      {/* Weekday Column Headers (Monday to Sunday) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="py-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none"
          >
            <span className="hidden xl:inline">{day.full}</span>
            <span className="xl:hidden">{day.short}</span>
          </div>
        ))}
      </div>

      {/* Modern 7-Column Date Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const dateString = format(day, 'yyyy-MM-dd')
          const isSelected = isSameDay(day, parsedSelectedDate)
          const isCurrentMonth = isSameMonth(day, viewDate)
          const isTodayDate = dateString === today
          const dayNumber = format(day, 'd')

          // Activity counts from actual context data
          const dayTasks = tasks.filter((t) => t.date === dateString)
          const totalTasks = dayTasks.length
          const completedTasks = dayTasks.filter((t) => t.completed).length
          const pendingTasks = totalTasks - completedTasks
          const hasCompletedTasks = completedTasks > 0
          const hasPendingTasks = pendingTasks > 0
          const hasReview = Boolean(reviews.find((r) => r.date === dateString))

          return (
            <button
              key={dateString}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${
                isTodayDate ? ' (Today)' : ''
              }${isSelected ? ' (Selected)' : ''}${
                totalTasks > 0
                  ? ` (${completedTasks} of ${totalTasks} tasks completed)`
                  : ''
              }${hasReview ? ' (Daily journal logged)' : ''}`}
              className={`group relative flex flex-col justify-between p-1.5 sm:p-2.5 min-h-[58px] sm:min-h-[76px] md:min-h-[90px] rounded-xl sm:rounded-2xl text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 active:scale-[0.98] ${
                isSelected
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 ring-2 ring-blue-600 dark:ring-blue-500 shadow-xs z-10'
                  : isTodayDate
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 ring-1.5 ring-blue-500/60 dark:ring-blue-400/60 hover:bg-blue-50/80 dark:hover:bg-blue-950/40'
                  : isCurrentMonth
                  ? 'bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-100/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'bg-transparent text-slate-300 dark:text-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
              }`}
            >
              {/* Day Header: Date Number + Optional Large-Screen Today Pill */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-xs scale-105'
                      : isTodayDate
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
                      : isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {dayNumber}
                </span>

                {/* Large-Screen Today Pill */}
                {isTodayDate && (
                  <span
                    className={`hidden lg:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80'
                    }`}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Minimal Activity Indicators (Small Colored Dots) */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full min-h-[10px] mt-auto pt-1">
                {hasCompletedTasks && (
                  <span
                    title={`${completedTasks} completed task${completedTasks > 1 ? 's' : ''}`}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-2xs transition-transform group-hover:scale-125"
                  />
                )}
                {hasPendingTasks && (
                  <span
                    title={`${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''}`}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-2xs transition-transform group-hover:scale-125"
                  />
                )}
                {hasReview && (
                  <span
                    title="Daily journal logged"
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-2xs transition-transform group-hover:scale-125"
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Activity Indicator Legend */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span>Completed tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span>Pending tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400" />
          <span>Daily journal</span>
        </div>
      </div>
    </div>
  )
}
