import logo from '../../assets/logo.png'

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
        <img
          src={logo}
          alt="DayTrack"
          className="w-14 h-14 object-contain animate-pulse drop-shadow-md"
        />
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading DayTrack view...</span>
        </div>
        <span className="sr-only">Loading content, please wait...</span>
      </div>
    </div>
  )
}
