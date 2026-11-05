import { Link } from 'react-router-dom'
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
  PenLine,
} from 'lucide-react'
import { MOOD_CONFIG } from '../journal/journalConstants'

export default function DailyFocus({ review }) {
  const moodConfig = review?.mood ? (MOOD_CONFIG[review.mood] || MOOD_CONFIG.Good) : null
  const MoodIcon = moodConfig?.icon

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Daily Self-Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reflections, mindset &amp; focus
            </p>
          </div>
        </div>

        <Link
          to="/journal"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
        >
          <span>Journal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!review ? (
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No review written yet for this day
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-0.5 mb-3.5 leading-relaxed">
            Document your wins, record key learnings, and declare your primary focus for tomorrow.
          </p>
          <Link
            to="/journal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
            Write Daily Review
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Mood Callout */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Reported Mood
            </span>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${moodConfig.badge}`}>
              {MoodIcon && <MoodIcon className="w-3.5 h-3.5" />}
              <span>{review.mood}</span>
            </div>
          </div>

          {/* Tomorrow's Focus Preview */}
          {review.tomorrowFocus && (
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-3 h-3" />
                Tomorrow&apos;s Focus
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                {review.tomorrowFocus}
              </p>
            </div>
          )}

          {/* Accomplishments Preview */}
          {review.accomplishments && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Trophy className="w-3 h-3" />
                Accomplishments
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {review.accomplishments}
              </p>
            </div>
          )}

          {/* Full review link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/journal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
            >
              <span>View full reflection &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
