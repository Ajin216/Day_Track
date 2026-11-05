import { Tags, CheckCircle2, AlertCircle } from 'lucide-react'

// Dynamic categorical color palette to style any category returned by the API
const CATEGORY_PALETTE = [
  { fill: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { fill: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { fill: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { fill: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { fill: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  { fill: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { fill: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
]

export default function CategoryChart({ categoryDistribution = [] }) {
  const hasCategories = categoryDistribution && categoryDistribution.length > 0
  const totalCategoryTasks = categoryDistribution.reduce((acc, c) => acc + (c.total || 0), 0)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Category Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamic focus time across user-defined categories
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {categoryDistribution.length} {categoryDistribution.length === 1 ? 'Category' : 'Categories'}
          </span>
        </div>

        {!hasCategories ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              No categorized tasks recorded this month.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Categories will dynamically populate from your created tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {categoryDistribution.map((cat, idx) => {
              const style = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]
              const completionRate = cat.completionPercentage ?? 0

              return (
                <div
                  key={cat.category || idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.fill}`} />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {cat.category || 'General'}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${style.badge}`}>
                        {cat.percentage}% share
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {cat.completed} / {cat.total}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {completionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${style.fill}`}
                      style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>Dynamic breakdown derived from actual database records.</span>
        <span>{totalCategoryTasks} total tasks</span>
      </div>
    </div>
  )
}

