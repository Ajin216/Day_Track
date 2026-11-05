import { Sparkles } from 'lucide-react'

/**
 * Accessible, lightweight page loader displayed while lazy-loaded route chunks load.
 */
export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-800 dark:text-slate-100"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading DayTrack view...</span>
        </div>
        <span className="sr-only">Loading content, please wait...</span>
      </div>
    </div>
  )
}

