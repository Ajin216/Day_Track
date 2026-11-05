export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading analytics data">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Overview Cards Skeleton (7 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-7 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Main Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>

      {/* Secondary Distributions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-52 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-52 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

