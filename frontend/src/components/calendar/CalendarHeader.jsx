import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { format, parse } from 'date-fns'

export default function CalendarHeader({
  viewDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedDate,
  isToday,
}) {
  const currentMonthYear = format(viewDate, 'MMMM yyyy')
  const parsedSelected = parse(selectedDate, 'yyyy-MM-dd', new Date())
  const formattedSelected = format(parsedSelected, 'EEEE, MMMM d, yyyy')

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
      {/* Month Title & Prev/Next Controls */}
      <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {currentMonthYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly schedule &amp; activity overview
            </p>
          </div>
        </div>

        {/* Prev / Next Month Navigation */}
        <div className="flex items-center ml-2 border border-slate-200 dark:border-slate-700/80 rounded-xl p-0.5 bg-slate-50/80 dark:bg-slate-800/60 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            title="Previous month"
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next month"
            title="Next month"
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Controls: Today Button & Selected Date Badge */}
      <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
        <button
          type="button"
          onClick={onToday}
          aria-label="Jump to today"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 shrink-0"
        >
          Today
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-xs font-medium text-blue-900 dark:text-blue-200 min-w-0 max-w-full">
          <span className="text-blue-600 dark:text-blue-400 font-semibold shrink-0">
            Selected:
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {formattedSelected}
          </span>
          {isToday && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Today
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
