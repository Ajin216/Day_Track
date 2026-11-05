import {
  ListTodo,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Trophy,
  BookOpen,
} from 'lucide-react'

export default function OverviewMetrics({ overview = {} }) {
  const {
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    completionPercentage = 0,
    currentStreak = 0,
    longestStreak = 0,
    totalReviews = 0,
  } = overview

  const cards = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      subtitle: totalTasks === 0 ? 'No tasks recorded' : `${totalTasks} all-time tasks`,
      icon: ListTodo,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      badge: 'All-time',
    },
    {
      title: 'Completed',
      value: completedTasks,
      subtitle: `${completedTasks} finished actions`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'Resolved',
    },
    {
      title: 'Pending',
      value: pendingTasks,
      subtitle: `${pendingTasks} open tasks`,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      badge: 'In progress',
    },
    {
      title: 'Completion Rate',
      value: totalTasks > 0 ? `${completionPercentage}%` : '—',
      subtitle: totalTasks > 0 ? 'Execution efficiency' : 'No tasks planned',
      icon: Target,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      progress: totalTasks > 0 ? Math.min(100, Math.max(0, completionPercentage)) : null,
      progressColor: 'bg-purple-600 dark:bg-purple-500',
    },
    {
      title: 'Current Streak',
      value: currentStreak > 0 ? `${currentStreak}d` : '0d',
      subtitle: currentStreak > 0 ? 'Active momentum' : 'Start today',
      icon: Flame,
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      badge: currentStreak > 0 ? 'Active' : 'Idle',
      badgeColor:
        currentStreak > 0
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    },
    {
      title: 'Best Streak',
      value: longestStreak > 0 ? `${longestStreak}d` : '0d',
      subtitle: longestStreak > 0 ? 'Historical record' : 'No streak yet',
      icon: Trophy,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      badge: 'Record',
    },
    {
      title: 'Daily Reviews',
      value: totalReviews,
      subtitle: `${totalReviews} journal ${totalReviews === 1 ? 'entry' : 'entries'}`,
      icon: BookOpen,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      badge: 'Self-reviews',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              {/* Header: Title and Icon */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${card.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Value and Badge */}
              <div className="flex items-baseline justify-between gap-1 mt-1">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value}
                </div>
                {card.badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      card.badgeColor ||
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {card.subtitle}
              </p>
            </div>

            {/* Optional Progress Bar */}
            {card.progress !== null && card.progress !== undefined && (
              <div className="mt-3">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      card.progressColor || 'bg-blue-600'
                    }`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

