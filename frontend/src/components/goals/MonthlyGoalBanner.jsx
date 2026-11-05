import { useState } from 'react'
import {
  Target,
  Trophy,
  Edit3,
  CheckCircle2,
  Plus,
  Compass,
  TrendingUp,
} from 'lucide-react'
import { parse, format, isValid } from 'date-fns'
import { useMonthlyGoal } from '../../context/MonthlyGoalContext'
import MonthlyGoalModal from './MonthlyGoalModal'

export default function MonthlyGoalBanner() {
  const {
    activeMonth,
    activeGoal,
    loading,
    isModalOpen,
    modalGoal,
    openCreateModal,
    openEditModal,
    closeModal,
    updateProgress,
    completeGoal,
  } = useMonthlyGoal()

  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  // Format month and year e.g. "November 2026"
  const formattedMonthYear = (() => {
    try {
      const parsed = parse(activeMonth, 'yyyy-MM', new Date())
      return isValid(parsed) ? format(parsed, 'MMMM yyyy') : activeMonth
    } catch {
      return activeMonth
    }
  })()

  // Quick increment helper (+10% or complete)
  const handleQuickIncrement = async (increment) => {
    if (!activeGoal || isUpdatingProgress) return
    const currentProg = activeGoal.progress || 0
    const nextProg = Math.min(100, currentProg + increment)
    setIsUpdatingProgress(true)
    try {
      await updateProgress(nextProg)
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  // Quick complete helper
  const handleQuickComplete = async () => {
    const goalId = activeGoal?.id || activeGoal?._id
    if (!goalId || isUpdatingProgress) return
    setIsUpdatingProgress(true)
    try {
      await completeGoal(goalId)
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const isCompleted = activeGoal?.status === 'completed' || activeGoal?.progress >= 100
  const progress = activeGoal?.progress || 0
  const remainingProgress = Math.max(0, 100 - progress)

  return (
    <>
      {/* Editorial Monthly Goal Banner */}
      <section
        aria-label="Monthly Goal Banner"
        className="w-full mb-6"
      >
        {activeGoal ? (
          /* Active / Completed Goal Banner */
          <div
            className={`relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-xs ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white dark:from-slate-900 dark:via-blue-950/25 dark:to-slate-900 border-blue-200/80 dark:border-blue-900/50'
            }`}
          >
            {/* Subtle background decorative highlight */}
            <div
              className={`absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-40 ${
                isCompleted ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-blue-300 dark:bg-indigo-600'
              }`}
            />

            <div className="relative p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Left Column: Eyebrow Badge & Prominent Goal Title */}
                <div className="space-y-2 flex-1 min-w-0 pr-0 lg:pr-4">
                  {/* Eyebrow badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/80'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80'
                      }`}
                    >
                      {isCompleted ? (
                        <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>Monthly Goal • {formattedMonthYear}</span>
                    </span>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white dark:bg-emerald-500 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Achieved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                        <span>In Progress</span>
                      </span>
                    )}
                  </div>

                  {/* Goal Title - Highly prominent, bold hero typography */}
                  <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words">
                    {activeGoal.title}
                  </h2>
                </div>

                {/* Right Column: Prominent Progress Gauge & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-4 lg:w-96 xl:w-[440px] shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/70 dark:border-slate-800">
                  {/* Progress Gauge */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                        <span>Annual Progress</span>
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {progress}%
                        </span>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {isCompleted ? 'Complete' : `(${remainingProgress}% left)`}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Progress Track */}
                    <div className="w-full h-3.5 sm:h-4 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700/60 shadow-inner">
                      <div
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Monthly goal progress: ${progress}%`}
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-sm shadow-blue-500/30'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end shrink-0">
                    {/* Quick increment buttons if in progress */}
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleQuickIncrement(10)}
                        disabled={isUpdatingProgress}
                        title="Add 10% progress"
                        className="px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-200/70 dark:hover:bg-blue-900/60 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
                      >
                        +10%
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={handleQuickComplete}
                        disabled={isUpdatingProgress}
                        title="Mark complete"
                        className="p-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Goal action */}
                    <button
                      type="button"
                      onClick={() => openEditModal(activeGoal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Edit Goal</span>
                    </button>

                    {/* When completed, give option to define another goal */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={openCreateModal}
                        title="Set new goal for this month"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200/80 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-xl transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Goal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Prompt user to define a monthly goal */
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs p-4 sm:p-5 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Monthly Focus • {formattedMonthYear}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    No monthly goal set for {formattedMonthYear}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Anchor your daily routines with one key objective for this month.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Set Monthly Goal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Global Monthly Goal Modal */}
      <MonthlyGoalModal
        isOpen={isModalOpen}
        onClose={closeModal}
        goal={modalGoal}
      />
    </>
  )
}
