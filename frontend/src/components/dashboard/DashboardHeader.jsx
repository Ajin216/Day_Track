import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parse, format, isValid } from 'date-fns'
import { Calendar as CalendarIcon, RotateCcw, LayoutDashboard, Sparkles } from 'lucide-react'
import { useSelectedDate } from '../../context/SelectedDateContext'

/**
 * Returns a time-based greeting for the current local time.
 */
function getLocalGreeting(dateContext) {
  const hour = dateContext ? new Date().getHours() : new Date().getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 18) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

export default function DashboardHeader({
  selectedDate: propSelectedDate,
  isToday: propIsToday,
  onJumpToday,
}) {
  const selectedDateCtx = useSelectedDate?.()
  const selectedDate = propSelectedDate || selectedDateCtx?.selectedDate || ''
  const isToday = propIsToday !== undefined ? propIsToday : selectedDateCtx?.isToday

  const greeting = useMemo(() => getLocalGreeting(selectedDate), [selectedDate])

  const formattedDate = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'EEEE, MMMM d, yyyy')
      }
    } catch {
      // fallback
    }
    return selectedDate
  }, [selectedDate])

  const dateCardInfo = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return {
          dayNumber: format(parsed, 'dd'),
          monthYear: format(parsed, 'MMM yyyy').toUpperCase(),
          weekday: format(parsed, 'EEEE').toUpperCase(),
        }
      }
    } catch {
      // fallback
    }
    const parts = (selectedDate || '').split('-')
    return {
      dayNumber: parts[2] ? parts[2].padStart(2, '0') : '--',
      monthYear: parts[0] && parts[1] ? `${parts[1]} ${parts[0]}`.toUpperCase() : 'DATE',
      weekday: '',
    }
  }, [selectedDate])

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* 1. Left: Greeting & Date Overview */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            {greeting}
          </span>
          {isToday ? (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              • Real-time today view
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              • Viewing historical / future context
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-blue-600 dark:text-blue-500 hidden sm:inline-block" />
          Your daily overview
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 pt-0.5">
          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formattedDate}
          </span>
          {isToday && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white leading-none">
              Today
            </span>
          )}
        </p>
      </div>

      {/* 2. Middle: Visual Date Card */}
      <div className="flex-shrink-0 self-start md:self-center">
        <div className="inline-flex items-center gap-3.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          {/* Large Date Number (Most prominent) */}
          <div className="flex items-center justify-center min-w-[2.5rem] sm:min-w-[2.75rem]">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 font-mono sm:font-sans leading-none select-none">
              {dateCardInfo.dayNumber}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 sm:h-9 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          {/* Month/Year & Weekday */}
          <div className="flex flex-col justify-center text-left leading-tight select-none">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
              {dateCardInfo.monthYear}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-0.5">
              {dateCardInfo.weekday}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Right: Action Shortcuts */}
      <div className="flex items-center flex-wrap gap-2.5 self-start md:self-center">
        {!isToday && (
          <button
            type="button"
            onClick={onJumpToday}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Jump to Today
          </button>
        )}

        <Link
          to="/calendar"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Change in Calendar
        </Link>
      </div>
    </div>
  )
}
