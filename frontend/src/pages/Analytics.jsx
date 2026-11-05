import { useState, useEffect, useCallback } from 'react'
import { parse, format, subMonths, addMonths } from 'date-fns'
import { AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { useSelectedDate } from '../context/SelectedDateContext'
import { analyticsService } from '../services/analyticsService'
import AnalyticsHeader from '../components/analytics/AnalyticsHeader'
import OverviewMetrics from '../components/analytics/OverviewMetrics'
import WeeklyChart from '../components/analytics/WeeklyChart'
import MonthlyOverview from '../components/analytics/MonthlyOverview'
import PriorityChart from '../components/analytics/PriorityChart'
import CategoryChart from '../components/analytics/CategoryChart'
import AnalyticsSkeleton from '../components/analytics/AnalyticsSkeleton'
import DateIndicator from '../components/common/DateIndicator'

export default function Analytics() {
  const { selectedDate, setSelectedDate, today, isToday } = useSelectedDate()

  // Track active month (YYYY-MM). Derived from selectedDate with optional manual override
  const selectedMonth = selectedDate.slice(0, 7)
  const [customMonth, setCustomMonth] = useState(null)
  const activeMonth = customMonth || selectedMonth

  const [overview, setOverview] = useState({})
  const [weeklyData, setWeeklyData] = useState({})
  const [monthlyData, setMonthlyData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  // Fetch analytics telemetry concurrently from backend
  useEffect(() => {
    let isMounted = true

    const loadAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const [overviewRes, weeklyRes, monthlyRes] = await Promise.all([
          analyticsService.getOverview({ date: selectedDate }),
          analyticsService.getWeeklyAnalytics({ date: selectedDate }),
          analyticsService.getMonthlyAnalytics({ month: activeMonth }),
        ])

        if (isMounted) {
          setOverview(overviewRes || {})
          setWeeklyData(weeklyRes || {})
          setMonthlyData(monthlyRes || {})
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load analytics:', err)
          setError(
            err.message ||
              'Unable to load analytics data from DayTrack server. Please check your connection and retry.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    return () => {
      isMounted = false
    }
  }, [selectedDate, activeMonth, refreshIndex])

  const handlePrevMonth = useCallback(() => {
    try {
      const parsed = parse(`${activeMonth}-01`, 'yyyy-MM-dd', new Date())
      const prev = subMonths(parsed, 1)
      setCustomMonth(format(prev, 'yyyy-MM'))
    } catch (e) {
      console.warn('Error navigating to previous month:', e)
    }
  }, [activeMonth])

  const handleNextMonth = useCallback(() => {
    try {
      const parsed = parse(`${activeMonth}-01`, 'yyyy-MM-dd', new Date())
      const next = addMonths(parsed, 1)
      setCustomMonth(format(next, 'yyyy-MM'))
    } catch (e) {
      console.warn('Error navigating to next month:', e)
    }
  }, [activeMonth])

  const handleJumpToday = useCallback(() => {
    setSelectedDate(today)
    setCustomMonth(null)
  }, [setSelectedDate, today])

  const handleManualRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  const isBrandNewUser = !loading && !error && (overview?.totalTasks || 0) === 0

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Month Stepper & Today Action */}
      <AnalyticsHeader
        selectedDate={selectedDate}
        activeMonth={activeMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleJumpToday}
        onRefresh={handleManualRefresh}
        loading={loading}
        isToday={isToday}
      />

      {/* Date Alert Context Indicator */}
      <DateIndicator compact />

      {/* 2. Error State Banner with Retry */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Error Loading Analytics</h4>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* 3. Empty State Welcome Banner for Fresh Users */}
      {isBrandNewUser && (
        <div className="p-5 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Welcome to DayTrack Productivity Analytics!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                You haven&apos;t created any tasks yet. Once you schedule actions and complete your
                first daily reviews, your live productivity velocity, completion charts, and streak
                momentum will appear here automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-slate-700 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All systems connected
          </div>
        </div>
      )}

      {/* 4. Loading Skeleton vs Rendered Dashboard */}
      {loading && !overview?.totalTasks && !error ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Overview Cards (7 Lifetime Metrics) */}
          <OverviewMetrics overview={overview} />

          {/* Primary Charts: Weekly Velocity & Monthly Productivity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyChart weeklyData={weeklyData} />
            <MonthlyOverview monthlyData={monthlyData} />
          </div>

          {/* Secondary Distributions: Priority Breakdown & Dynamic Category Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PriorityChart priorityDistribution={monthlyData?.priorityDistribution} />
            <CategoryChart categoryDistribution={monthlyData?.categoryDistribution} />
          </div>
        </div>
      )}
    </div>
  )
}
