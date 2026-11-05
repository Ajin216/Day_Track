import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parse, format } from 'date-fns'
import { Calendar, CheckCircle2, RotateCcw, Lock } from 'lucide-react'
import { useSelectedDate } from '../../context/SelectedDateContext'

export default function DateIndicator({ compact = false }) {
  const { selectedDate, setSelectedDate, today, isToday, isHistorical } = useSelectedDate()

  const formattedDate = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      return format(parsed, 'EEEE, MMMM d, yyyy')
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  const handleResetToToday = () => {
    setSelectedDate(today)
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-xs font-medium text-slate-700 dark:text-slate-200">
        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-slate-900 dark:text-slate-100">{formattedDate}</span>
        {isToday ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Today
          </span>
        ) : isHistorical ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
            Past Date (Read Only)
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResetToToday}
            title="Reset to today"
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Today
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Active Viewing Date
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
            <span>{formattedDate}</span>
            {isToday ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">
                <CheckCircle2 className="w-3 h-3" />
                Today
              </span>
            ) : isHistorical ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Past Date • Read Only
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                Future Date
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        {!isToday && (
          <button
            type="button"
            onClick={handleResetToToday}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-blue-500" />
            Jump to Today
          </button>
        )}
        <Link
          to="/calendar"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
        >
          Change Date in Calendar
        </Link>
      </div>
    </div>
  )
}
