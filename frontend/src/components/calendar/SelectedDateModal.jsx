import { useMemo, useEffect, useRef } from 'react'
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
  X,
} from 'lucide-react'
import { useSelectedDate } from '../../context/SelectedDateContext'
import { useTasks } from '../../context/TaskContext'
import { useDailyReview } from '../../context/DailyReviewContext'

export default function SelectedDateModal({ isOpen, onClose }) {
  const { selectedDate, setSelectedDate, today, isToday, isHistorical } = useSelectedDate()
  const { getTasksByDate } = useTasks()
  const { getReviewByDate } = useDailyReview()

  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

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
  const monthYear = useMemo(() => format(parsedDate, 'MMMM yyyy').toUpperCase(), [parsedDate])
  const weekday = useMemo(() => format(parsedDate, 'EEEE').toUpperCase(), [parsedDate])

  // Contextual activity data for this specific day
  const dayTasks = useMemo(() => getTasksByDate(selectedDate), [getTasksByDate, selectedDate])
  const dayReview = useMemo(() => getReviewByDate(selectedDate), [getReviewByDate, selectedDate])

  const totalTasks = dayTasks.length
  const completedTasks = dayTasks.filter((t) => t.completed).length

  // Lock background scrolling while modal is open (both document.body and main layout container)
  useEffect(() => {
    if (!isOpen) return

    const originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const mainEl = document.querySelector('main')
    const originalMainOverflow = mainEl ? mainEl.style.overflow : ''
    if (mainEl) {
      mainEl.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow
      if (mainEl) {
        mainEl.style.overflow = originalMainOverflow
      }
    }
  }, [isOpen])

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus management & accessible focus trap
  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    if (!dialog) return

    const previousActiveElement = document.activeElement

    // Initial focus on close button
    if (closeButtonRef.current) {
      closeButtonRef.current.focus()
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      const focusableElements = dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey)

    return () => {
      dialog.removeEventListener('keydown', handleTabKey)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleTodayClick = () => {
    setSelectedDate(today)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-date-title"
      aria-describedby="modal-date-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Modal Dialog Card: Centered on desktop, bottom sheet on mobile */}
      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-md md:max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div
          className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="px-5 pt-3 sm:pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2
              id="modal-date-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate"
            >
              {formattedFull}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          id="modal-date-desc"
          className="overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {/* Status Badge & Jump to Today Bar */}
          <div className="flex items-center justify-between gap-2">
            <div>
              {isToday ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Today
                </span>
              ) : isHistorical ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Past Date (Read Only)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Future Date
                </span>
              )}
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

          {/* Visual Date Showcase Card */}
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
          </div>

          {/* Daily Activity Summary */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Tasks
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">
                {totalTasks === 0 ? (
                  <span className="text-slate-400 dark:text-slate-500 font-normal">None logged</span>
                ) : (
                  <span>
                    {completedTasks}/{totalTasks} done
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Daily Journal
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">
                {dayReview ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-normal">Not logged</span>
                )}
              </div>
            </div>
          </div>

          {/* Historical Date Read-Only Guidance */}
          {isHistorical && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
              <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Read-Only Date</span>
                <span className="text-amber-700/90 dark:text-amber-400/90">
                  Past date records are preserved in read-only mode. Tasks and journal entries cannot be created or modified.
                </span>
              </div>
            </div>
          )}

          {/* Three Direct Navigation Actions */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navigation Actions
            </div>

            {/* Action: Dashboard */}
            <Link
              to="/dashboard"
              onClick={onClose}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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
              onClick={onClose}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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
              onClick={onClose}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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

          {/* Close Action in Footer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

