import { useState, useEffect } from 'react'
import {
  X,
  Target,
  Sparkles,
  Trophy,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { parse, format, isValid } from 'date-fns'
import { useMonthlyGoal } from '../../context/MonthlyGoalContext'

function GoalFormContent({ goal, activeMonth, onClose }) {
  const {
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
  } = useMonthlyGoal()

  const goalId = goal?.id || goal?._id
  const isEditing = Boolean(goalId)

  const [title, setTitle] = useState(goal?.title || '')
  const [progress, setProgress] = useState(
    typeof goal?.progress === 'number' ? goal.progress : 0
  )
  const [status, setStatus] = useState(goal?.status || 'in_progress')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [replaceConflict, setReplaceConflict] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Format month name for title
  const formattedMonth = (() => {
    try {
      const parsed = parse(goal?.month || activeMonth, 'yyyy-MM', new Date())
      return isValid(parsed) ? format(parsed, 'MMMM yyyy') : activeMonth
    } catch {
      return activeMonth
    }
  })()

  // Progress slider change
  const handleProgressChange = (newVal) => {
    const numeric = Math.min(100, Math.max(0, Number(newVal) || 0))
    setProgress(numeric)
    if (numeric === 100) {
      setStatus('completed')
    } else if (status === 'completed' && numeric < 100) {
      setStatus('in_progress')
    }
  }

  // Handle Save / Submit
  const handleSubmit = async (e, forceReplace = false) => {
    if (e) e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('Goal title is required.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (isEditing) {
        const res = await updateGoal(goalId, {
          title: title.trim(),
          progress: Number(progress),
          status: progress === 100 ? 'completed' : status,
        })

        if (res.success) {
          onClose()
        } else {
          setErrorMessage(res.error || 'Failed to update monthly goal.')
        }
      } else {
        const payload = {
          title: title.trim(),
          progress: Number(progress),
          month: activeMonth,
          replace: forceReplace,
        }

        const res = await createGoal(payload)

        if (res.success) {
          onClose()
        } else if (res.conflict) {
          setReplaceConflict(res.existingGoal || { title: 'Existing Active Goal' })
        } else {
          setErrorMessage(res.error || 'Failed to create monthly goal.')
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Complete directly
  const handleMarkComplete = async () => {
    if (!isEditing || !goalId) {
      setProgress(100)
      setStatus('completed')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await completeGoal(goalId)
      if (res.success) {
        onClose()
      } else {
        setErrorMessage(res.error || 'Failed to complete goal.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!goalId) return

    setSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await deleteGoal(goalId)
      if (res.success) {
        onClose()
      } else {
        setErrorMessage(res.error || 'Failed to delete goal.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="goal-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {isEditing ? 'Edit Monthly Goal' : 'Define Monthly Goal'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Focus for {formattedMonth}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conflict / Replace Confirmation Banner */}
      {replaceConflict && (
        <div className="p-4 mx-6 mt-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Active Goal Already Exists for {formattedMonth}
              </p>
              <p className="text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                You already have an active goal: &ldquo;{replaceConflict.title}&rdquo;.
                Setting this new goal will automatically mark the existing goal as completed
                and preserve it in your history.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit(null, true)}
                  disabled={submitting}
                  className="px-3 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-lg transition-colors shadow-xs"
                >
                  {submitting ? 'Replacing...' : 'Confirm & Replace'}
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceConflict(null)}
                  disabled={submitting}
                  className="px-2.5 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                >
                  Keep Existing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="px-6 pt-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Modal Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5">
        {/* Goal Title */}
        <div>
          <label
            htmlFor="goal-title"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Monthly Goal Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="goal-title"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. Master React Performance & Ship DayTrack v2.0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
            <span>Your primary anchor for this calendar month.</span>
            <span>{title.length}/200</span>
          </div>
        </div>

        {/* Annual Progress */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="goal-progress"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <span>Annual Progress</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({100 - progress}% remaining)
              </span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => handleProgressChange(e.target.value)}
                disabled={submitting}
                className="w-14 px-2 py-0.5 text-right font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>

          {/* Range Slider */}
          <input
            id="goal-progress"
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={(e) => handleProgressChange(e.target.value)}
            disabled={submitting}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between gap-1.5 mt-2.5">
            {[0, 25, 50, 75, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleProgressChange(preset)}
                disabled={submitting}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  progress === preset
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Completion Celebratory Notification */}
          {progress === 100 && (
            <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">
                100% complete! This goal will be celebrated and saved as completed.
              </span>
            </div>
          )}
        </div>

        {/* Delete confirmation or buttons */}
        {showDeleteConfirm ? (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-rose-800 dark:text-rose-300">
              Are you sure you want to delete this monthly goal?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-3 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Goal'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={submitting}
                className="px-2.5 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {/* Left Action: Delete */}
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={submitting}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-xs inline-flex items-center gap-1.5"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>

            {/* Right Actions: Cancel & Save */}
            <div className="flex items-center gap-2">
              {isEditing && status !== 'completed' && progress < 100 && (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={submitting}
                  className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Early</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Save Changes' : 'Set Monthly Goal'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </>
  )
}

export default function MonthlyGoalModal({ isOpen, onClose, goal = null }) {
  const { activeMonth } = useMonthlyGoal()

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        <GoalFormContent
          key={`${goal?.id || goal?._id || 'new'}-${isOpen}`}
          goal={goal}
          activeMonth={activeMonth}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
