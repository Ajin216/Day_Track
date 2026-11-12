import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, parse, isValid } from 'date-fns'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { useSelectedDate } from '../../context/SelectedDateContext'
import { useTasks } from '../../context/TaskContext'
import { useDailyReview } from '../../context/DailyReviewContext'

export default function SelectedDatePanel({ onJumpToday }) {
  const { selectedDate, setSelectedDate, today, isToday, isHistorical } = useSelectedDate()
  const { getTasksByDate } = useTasks()
  const { getReviewByDate } = useDailyReview()

  // Format the selected date
  const parsedDate = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      return isValid(parsed) ? parsed : new Date()
    } catch {
      return new Date()
    }
  }, [selectedDate])

  const formattedFull = useMemo(() => {
    return format(parsedDate, 'EEEE, MMMM d, yyyy')
  }, [parsedDate])

  const dayNumber = useMemo(() => format(parsedDate, 'dd'), [parsedDate])
  const monthYear = useMemo(() => format(parsedDate, 'MMM yyyy').toUpperCase(), [parsedDate])
  const weekday = useMemo(() => format(parsedDate, 'EEEE').toUpperCase(), [parsedDate])

  // Contextual activity data for this specific day
  const dayTasks = useMemo(() => getTasksByDate(selectedDate), [getTasksByDate, selectedDate])
  const dayReview = useMemo(() => getReviewByDate(selectedDate), [getReviewByDate, selectedDate])

  const totalTasks = dayTasks.length
  const completedTasks = dayTasks.filter((t) => t.completed).length

  const handleTodayClick = () => {
    if (onJumpToday) {
      onJumpToday()
    } else {
      setSelectedDate(today)
    }
  }

  return (
    <aside
      aria-label="Selected Date Context"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 sm:p-5 transition-colors space-y-4"
    >
      {/* 1. Header: Context Label & Status Badges */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Selected Date
        </span>

        {/* Date Status Badge */}
        {isToday ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Today
          </span>
        ) : isHistorical ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Past Date (Read Only)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CalendarIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            Future Date
          </span>
        )}
      </div>

      {/* 2. Visual Date Showcase Card */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <span className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 font-mono sm:font-sans leading-none select-none">
            {dayNumber}
          </span>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700/80" aria-hidden="true" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
              {monthYear}
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-0.5">
              {weekday}
            </span>
          </div>
        </div>

        {/* Jump to Today Shortcut */}
        {!isToday && (
          <button
            type="button"
            onClick={handleTodayClick}
            title="Jump back to current date"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Today</span>
          </button>
        )}
      </div>

      {/* 3. Activity Quick Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
            Tasks
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {totalTasks === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 font-normal">None</span>
            ) : (
              <span>
                {completedTasks}/{totalTasks} done
              </span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
            Daily Journal
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {dayReview ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Logged
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-normal">Not logged</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Three Direct Navigation Actions */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Actions for {formattedFull}
        </div>

        {/* Action: Dashboard */}
        <Link
          to="/dashboard"
          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Dashboard
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                View daily overview &amp; focus
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Action: Tasks */}
        <Link
          to="/tasks"
          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Tasks
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                View &amp; organize day tasks
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Action: Journal */}
        <Link
          to="/journal"
          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Daily Journal
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHistorical ? 'Read reflection log' : 'Write or view daily review'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* 5. Historical Date Read-Only Guidance */}
      {isHistorical && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
          <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Past date records are preserved in read-only mode.</span>
        </div>
      )}
    </aside>
  )
}

