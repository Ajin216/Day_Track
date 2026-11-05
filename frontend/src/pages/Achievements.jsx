import { useState, useEffect, useMemo } from 'react'
import {
  Trophy,
  Calendar,
  Sparkles,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Award,
} from 'lucide-react'
import { goalService } from '../services/goalService'
import { useMonthlyGoal } from '../context/MonthlyGoalContext'
import AchievementCard from '../components/achievements/AchievementCard'

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export default function Achievements() {
  const { openCreateModal, activeGoal } = useMonthlyGoal()

  const [achievements, setAchievements] = useState([])
  const [stats, setStats] = useState({
    totalCompleted: 0,
    monthsCount: 0,
    availableYears: [],
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  })

  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch achievements with query filters
  useEffect(() => {
    let isMounted = true

    const loadAchievements = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = { page: currentPage, limit: 12 }

        if (selectedYear !== 'all' && selectedMonth !== 'all') {
          params.month = `${selectedYear}-${selectedMonth}`
        } else if (selectedYear !== 'all') {
          params.year = selectedYear
        } else if (selectedMonth !== 'all') {
          const currentYear = new Date().getFullYear().toString()
          params.month = `${currentYear}-${selectedMonth}`
        }

        const data = await goalService.getAchievements(params)
        if (isMounted) {
          setAchievements(data.achievements || [])
          setStats((prev) => ({
            ...prev,
            totalCompleted: data.stats?.totalCompleted ?? prev.totalCompleted,
            monthsCount: data.stats?.monthsCount ?? prev.monthsCount,
            availableYears: data.stats?.availableYears || prev.availableYears,
          }))
          setPagination(
            data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 }
          )
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load achievements:', err)
          setError(err.message || 'Failed to load achievements.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAchievements()

    return () => {
      isMounted = false
    }
  }, [currentPage, selectedYear, selectedMonth, refreshTrigger, activeGoal])

  // Filter change handlers
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value)
    setCurrentPage(1)
  }

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedYear('all')
    setSelectedMonth('all')
    setCurrentPage(1)
  }

  const handleRetry = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const isFiltered = selectedYear !== 'all' || selectedMonth !== 'all'

  // Dynamic Year Dropdown list
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear().toString()
    const years = new Set(stats.availableYears || [])
    years.add(currentYear)
    return Array.from(years).sort().reverse()
  }, [stats.availableYears])

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
              <Trophy className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Personal Milestones
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Your Achievements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every completed goal is a step forward.
          </p>
        </div>

        {/* Set Goal CTA */}
        <button
          type="button"
          onClick={openCreateModal}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Define Monthly Goal</span>
        </button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Completed Goals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Completed Goals
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.totalCompleted}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Achieved milestone anchors
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Months with Completed Goals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Months with Victories
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.monthsCount}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Calendar consistency
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Momentum Indicator */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-5 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Growth</span>
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
              {stats.totalCompleted > 0
                ? `${stats.totalCompleted} key ambitions fully realized`
                : 'Your journey starts with this month'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preserved permanently in your history
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs border border-emerald-100 dark:border-emerald-800/40">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter By:</span>
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={handleYearChange}
            aria-label="Filter by year"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All Years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            aria-label="Filter by month"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All Months</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Count summary */}
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {achievements.length} of {pagination.total} achievements
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading your achievements...
          </p>
        </div>
      ) : achievements.length > 0 ? (
        /* Achievements Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((item) => (
            <AchievementCard key={item.id || item._id} achievement={item} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/40">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isFiltered ? 'No matching achievements' : 'No completed goals yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isFiltered
              ? 'There are no completed goals matching your selected year or month filters.'
              : 'Every milestone you achieve will be preserved here permanently as part of your personal track record.'}
          </p>
          <div className="pt-2">
            {isFiltered ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Define Your First Monthly Goal</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={currentPage >= pagination.totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
