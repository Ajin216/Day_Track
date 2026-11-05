/**
 * StatsCard - Reusable metric card for DayTrack daily dashboard.
 * Supports numbers, percentages, empty states, and visual progress indicator.
 */
export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
  badgeType = 'neutral',
  progress = null,
}) {
  const variantStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      progressFill: 'bg-blue-600 dark:bg-blue-500',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      progressFill: 'bg-emerald-600 dark:bg-emerald-500',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      progressFill: 'bg-amber-600 dark:bg-amber-500',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      progressFill: 'bg-indigo-600 dark:bg-indigo-500',
    },
  }

  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  }

  const selectedVariant = variantStyles[variant] || variantStyles.blue
  const isStringValue = typeof value === 'string' && isNaN(Number(value))

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div>
        {/* Top Header: Title & Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className={`p-2 rounded-lg ${selectedVariant.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Value and Badge */}
        <div className="flex items-baseline justify-between gap-2">
          <div
            className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
              isStringValue ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {value}
          </div>
          {badge && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                badgeStyles[badgeType] || badgeStyles.neutral
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Subtitle & Progress */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
        {progress !== null && typeof progress === 'number' && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${selectedVariant.progressFill}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
