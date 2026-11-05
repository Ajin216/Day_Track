import { useState } from 'react'
import {
  Sparkles,
  Trophy,
  Compass,
  Smile,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react'
import MoodSelector from './MoodSelector'

export default function ReviewForm({
  initialData = null,
  date,
  onSubmit,
  onCancel,
  submitLabel = 'Save Daily Review',
}) {
  const [accomplishments, setAccomplishments] = useState(initialData?.accomplishments || '')
  const [improvements, setImprovements] = useState(initialData?.improvements || '')
  const [tomorrowFocus, setTomorrowFocus] = useState(initialData?.tomorrowFocus || '')
  const [mood, setMood] = useState(initialData?.mood || 'Good')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const trimmedAcc = accomplishments.trim()
    const trimmedImp = improvements.trim()
    const trimmedFoc = tomorrowFocus.trim()

    if (!trimmedAcc) {
      setError('Please share at least one accomplishment from today.')
      return
    }
    if (!trimmedImp) {
      setError('Please reflect on what could be improved or optimized.')
      return
    }
    if (!trimmedFoc) {
      setError('Please define your key focus or priority for tomorrow.')
      return
    }
    if (!mood) {
      setError('Please select your mood for the day.')
      return
    }

    setError('')
    onSubmit({
      date,
      accomplishments: trimmedAcc,
      improvements: trimmedImp,
      tomorrowFocus: trimmedFoc,
      mood,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Mood Selector Section */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Daily Mood Rating <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          How would you rate your overall energy, clarity, and mood today?
        </p>
        <MoodSelector value={mood} onChange={(val) => { setMood(val); if (error) setError(''); }} />
      </div>

      {/* 1. Accomplishments */}
      <div className="space-y-1.5">
        <label
          htmlFor="journal-accomplishments"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          What did I accomplish today? <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Celebrate progress, completed milestones, key decisions, or productive habits.
        </p>
        <textarea
          id="journal-accomplishments"
          rows={3}
          value={accomplishments}
          onChange={(e) => {
            setAccomplishments(e.target.value)
            if (error) setError('')
          }}
          placeholder="e.g. Wrapped up quarterly sprint deliverables, maintained zero-inbox, and went for a 30-minute evening run..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y min-h-[90px]"
        />
      </div>

      {/* 2. Improvements */}
      <div className="space-y-1.5">
        <label
          htmlFor="journal-improvements"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          What could I have done better today? <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Identify friction, distractions, missed commitments, or energy bottlenecks with honesty.
        </p>
        <textarea
          id="journal-improvements"
          rows={3}
          value={improvements}
          onChange={(e) => {
            setImprovements(e.target.value)
            if (error) setError('')
          }}
          placeholder="e.g. Spent too much time multitasking before noon; should protect morning deep-work blocks and silence notifications..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y min-h-[90px]"
        />
      </div>

      {/* 3. Tomorrow's Focus */}
      <div className="space-y-1.5">
        <label
          htmlFor="journal-tomorrow-focus"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          What should I focus on tomorrow? <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your single highest-leverage intention or prime objective for the upcoming day.
        </p>
        <textarea
          id="journal-tomorrow-focus"
          rows={3}
          value={tomorrowFocus}
          onChange={(e) => {
            setTomorrowFocus(e.target.value)
            if (error) setError('')
          }}
          placeholder="e.g. Finalize engineering architecture design document by 2 PM, then prepare team retrospective deck..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y min-h-[90px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <Save className="w-4 h-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

