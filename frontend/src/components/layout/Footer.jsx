/**
 * Footer Component
 * Subtle, modern creator attribution for DayTrack.
 * Features the AB monogram, "Crafted by AB", and a clickable portfolio link.
 */
export default function Footer({ className = '' }) {
  return (
    <footer
      role="contentinfo"
      className={`mt-12 pt-6 pb-6 border-t border-slate-200 dark:border-slate-800 transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs">
        {/* Creator Attribution with Stylish AB Monogram */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] tracking-wider shadow-2xs select-none ring-1 ring-blue-700/20"
          >
            AB
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Crafted by{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              AB
            </span>
          </span>
        </div>

        {/* Portfolio Link */}
        <a
          href="https://portfolio-ajin-biju.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1 px-2 -my-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <span>Visit My Portfolio ↗</span>
        </a>
      </div>
    </footer>
  )
}

