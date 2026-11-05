import { useMemo } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCw,
  Sparkles,
} from 'lucide-react'
import { format, parse, isValid } from 'date-fns'

export default function AnalyticsHeader({
  selectedDate,
  activeMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onRefresh,
  loading = false,
  isToday = false,
}) {
  const monthDisplay = useMemo(() => {
    try {
      const parsed = parse(`${activeMonth}-01`, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'MMMM yyyy')
      }
    } catch {
      // fallback
    }
    return activeMonth
  }, [activeMonth])

  const selectedDateDisplay = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'EEE, MMM d, yyyy')
      }
    } catch {
      // fallback
    }
    return selectedDate
  }, [selectedDate])

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Productivity Analytics
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3 h-3" /> Live Telemetry
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive task completion velocity, streak momentum, and category allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Month Stepper, Active Date, Refresh, Today */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Month Navigation Stepper */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-xs">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={loading}
            aria-label="Previous Month"
            title="Previous Month"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap min-w-[120px] text-center">
            {monthDisplay}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={loading}
            aria-label="Next Month"
            title="Next Month"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Date Context Tag */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>Active: {selectedDateDisplay}</span>
        </div>

        {/* Jump to Today Button */}
        <button
          type="button"
          onClick={onToday}
          disabled={isToday}
          title={isToday ? "Viewing today's context" : 'Jump to Today'}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            isToday
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
          }`}
        >
          Today
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh analytics data"
          title="Refresh analytics data"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-xs"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </div>
  )
}

