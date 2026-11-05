import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart3, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

function CustomTooltip({ active, payload, isDark }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const isEmptyDay = !data?.hasTasks || data?.totalTasks === 0

    return (
      <div
        className={`p-3.5 rounded-xl shadow-lg border text-xs space-y-2 transition-colors min-w-[200px] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/60'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
          <span className="font-bold">{data?.dayOfWeek || data?.day}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {data?.date}
          </span>
        </div>

        {isEmptyDay ? (
          <div className="py-1 text-slate-400 dark:text-slate-500 italic text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            No tasks planned for this day
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed:
              </span>
              <span className="font-bold">{data?.completedTasks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> Pending:
              </span>
              <span className="font-bold">{data?.pendingTasks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Completion:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
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

export default function WeeklyChart({ weeklyData = {} }) {
  const { isDark } = useTheme()

  const {
    startDate = '',
    endDate = '',
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    completionPercentage = 0,
    activeDaysCount = 0,
    days = [],
  } = weeklyData

  const chartData = useMemo(() => {
    return days.map((d) => ({
      ...d,
      completed: d.completedTasks,
      pending: d.pendingTasks,
      // For visual clarity on empty days, bar value is 0
      isEmpty: !d.hasTasks || d.totalTasks === 0,
    }))
  }, [days])

  const hasAnyWeeklyTasks = totalTasks > 0

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Weekly Velocity (Mon – Sun)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {startDate && endDate ? `${startDate} to ${endDate}` : '7-Day Activity Window'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-900/50">
              {completedTasks} / {totalTasks} Tasks ({completionPercentage}%)
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {activeDaysCount} active {activeDaysCount === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Empty State Banner if no tasks planned for the week */}
        {!hasAnyWeeklyTasks && (
          <div className="py-2 mb-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 text-center">
            No tasks planned for this week. Empty days are not penalized as 0% completion.
          </div>
        )}

        {/* Recharts Bar Chart */}
        <div className="h-64 sm:h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                    {value === 'completed' ? 'Completed Tasks' : 'Pending Tasks'}
                  </span>
                )}
              />
              <Bar
                dataKey="completed"
                name="completed"
                stackId="week"
                fill="#3b82f6"
                radius={[0, 0, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                dataKey="pending"
                name="pending"
                stackId="week"
                fill={isDark ? '#475569' : '#cbd5e1'}
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Legend Note */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>Includes all tasks scheduled between Monday &amp; Sunday.</span>
        <span>{pendingTasks} pending</span>
      </div>
    </div>
  )
}

