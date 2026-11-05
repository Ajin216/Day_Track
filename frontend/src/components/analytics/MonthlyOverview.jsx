import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CalendarDays, CheckCircle2, Award, Clock } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { format, parse, isValid } from 'date-fns'

function MonthlyTooltip({ active, payload, isDark }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const isEmpty = !data?.hasTasks || data?.totalTasks === 0

    return (
      <div
        className={`p-3 rounded-xl shadow-lg border text-xs space-y-1.5 min-w-[180px] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/60'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-1 border-slate-100 dark:border-slate-800 font-bold">
          <span>Day {data?.dayOfMonth}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {data?.date}
          </span>
        </div>

        {isEmpty ? (
          <div className="py-1 text-slate-400 dark:text-slate-500 italic text-[11px]">
            No tasks planned
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
              <span>Completed:</span>
              <span className="font-bold">{data?.completedTasks}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Total:</span>
              <span className="font-semibold">{data?.totalTasks}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span>Completion:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {data?.completionPercentage !== null ? `${data.completionPercentage}%` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

export default function MonthlyOverview({ monthlyData = {} }) {
  const { isDark } = useTheme()

  const {
    month = '',
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    completionPercentage = 0,
    daysWithCompletedTasks = 0,
    dailyBreakdown = [],
  } = monthlyData

  const monthLabel = useMemo(() => {
    try {
      const parsed = parse(`${month}-01`, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'MMMM yyyy')
      }
    } catch {
      // fallback
    }
    return month
  }, [month])

  const chartData = useMemo(() => {
    return dailyBreakdown.map((d) => ({
      ...d,
      completed: d.completedTasks,
      total: d.totalTasks,
    }))
  }, [dailyBreakdown])

  const hasTasks = totalTasks > 0

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Monthly Productivity ({monthLabel})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily completion volume across the entire calendar month
              </p>
            </div>
          </div>

          {/* Monthly KPI Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-900/50 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              {daysWithCompletedTasks} Productive {daysWithCompletedTasks === 1 ? 'Day' : 'Days'}
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
              {completionPercentage}% Rate
            </div>
          </div>
        </div>

        {/* 3 Summary Mini-Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Month Tasks
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalTasks}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/40">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {completedTasks}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/40">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" /> Open
            </div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {pendingTasks}
            </div>
          </div>
        </div>

        {/* Area Chart: Daily Completion Velocity across Month */}
        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
                vertical={false}
              />
              <XAxis
                dataKey="dayOfMonth"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<MonthlyTooltip isDark={isDark} />} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#monthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>X-axis shows day of month (1–{dailyBreakdown.length}).</span>
        {!hasTasks && <span className="italic">No tasks in this month</span>}
      </div>
    </div>
  )
}

