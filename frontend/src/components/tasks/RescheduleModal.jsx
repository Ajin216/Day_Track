import { useState, useEffect } from 'react'
import { CalendarSync, X, AlertCircle } from 'lucide-react'
import { format, addDays, parse, isValid } from 'date-fns'

export default function RescheduleModal({
  isOpen,
  task,
  onConfirm,
  onCancel,
}) {
  const [newDate, setNewDate] = useState(() => task?.date || format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen || !task) return null

  const handleShortcut = (daysToAdd) => {
    const base = new Date()
    const target = daysToAdd === 0 ? base : addDays(base, daysToAdd)
    setNewDate(format(target, 'yyyy-MM-dd'))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setError('Please select a valid date.')
      return
    }

    const parsed = parse(newDate, 'yyyy-MM-dd', new Date())
    if (!isValid(parsed)) {
      setError('Invalid date.')
      return
    }

    onConfirm(newDate)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <CalendarSync className="w-5 h-5" />
          </div>

          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Reschedule Task
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Move &ldquo;{task.title}&rdquo; to a new date.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="reschedule-date"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Select New Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleShortcut(0)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(1)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <input
              id="reschedule-date"
              type="date"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value)
                if (error) setError('')
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
