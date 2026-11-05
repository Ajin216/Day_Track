import { useMemo } from 'react'
import {
  Trophy,
  Compass,
  Sparkles,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Lock,
} from 'lucide-react'
import { parse, format, isValid, parseISO } from 'date-fns'
import { MOOD_CONFIG } from './journalConstants'

export default function ReviewCard({ review, onEdit, onDelete, isReadOnly = false }) {
  const moodConfig = MOOD_CONFIG[review.mood] || MOOD_CONFIG.Good
  const MoodIcon = moodConfig.icon

  const formattedDate = useMemo(() => {
    try {
      const parsed = parse(review.date, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'EEEE, MMMM d, yyyy')
      }
    } catch {
      // fallback
    }
    return review.date
  }, [review.date])

  const formattedUpdated = useMemo(() => {
    try {
      if (review.updatedAt) {
        const parsed = parseISO(review.updatedAt)
        if (isValid(parsed)) {
          return format(parsed, 'MMM d, yyyy • h:mm a')
        }
      }
    } catch {
      // fallback
    }
    return null
  }, [review.updatedAt])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Top Banner with Mood Badge & Action Buttons */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center ${moodConfig.badge}`}>
            <MoodIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Daily Self-Review
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${moodConfig.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${moodConfig.dot}`} />
                Mood: {review.mood}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {formattedDate}
              </span>
              {formattedUpdated && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Updated {formattedUpdated}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {isReadOnly ? (
          <span
            title="Historical daily journals are read-only"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 select-none self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Archived Entry
          </span>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Review
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Review Content Sections */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* 1. Accomplishments */}
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Today&apos;s Accomplishments</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {review.accomplishments}
          </p>
        </div>

        {/* 2. Improvements */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Areas For Improvement &amp; Learnings</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {review.improvements}
          </p>
        </div>

        {/* 3. Tomorrow's Focus */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Tomorrow&apos;s Key Focus</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {review.tomorrowFocus}
          </p>
        </div>
      </div>
    </div>
  )
}
