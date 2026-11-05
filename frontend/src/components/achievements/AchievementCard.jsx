import { Trophy, CheckCircle2, Calendar, Target, Clock } from 'lucide-react'
import { parse, format, isValid } from 'date-fns'

export default function AchievementCard({ achievement }) {
  if (!achievement) return null

  // Format month and year (e.g., "November 2026")
  const formattedMonthYear = (() => {
    try {
      const parsed = parse(achievement.month, 'yyyy-MM', new Date())
      return isValid(parsed) ? format(parsed, 'MMMM yyyy') : achievement.month
    } catch {
      return achievement.month
    }
  })()

  // Format completion date
  const formattedCompletedDate = (() => {
    if (!achievement.completedAt) return null
    try {
      const parsed = new Date(achievement.completedAt)
      return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : null
    } catch {
      return null
    }
  })()

  const progress = achievement.progress || 100

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Subtle background ambient corner glow */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

      {/* Top Header: Badge, Month, Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Month & Year Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/80 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formattedMonthYear}</span>
          </span>

          {/* Achieved Status Pill */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>Achieved</span>
          </span>
        </div>

        {/* Goal Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug line-clamp-2">
          {achievement.title}
        </h3>

        {/* Description */}
        {achievement.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
            {achievement.description}
          </p>
        )}

        {/* Milestone / Target if present */}
        {achievement.target && (
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300/90 font-medium bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40 max-w-full">
            <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Milestone: {achievement.target}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Progress & Completion Timestamp */}
      <div className="pt-4 mt-4 border-t border-emerald-100 dark:border-emerald-900/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Progress</span>
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            {progress}% Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-emerald-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Completion Date */}
        {formattedCompletedDate && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Completed on {formattedCompletedDate}</span>
          </div>
        )}
      </div>
    </div>
  )
}

