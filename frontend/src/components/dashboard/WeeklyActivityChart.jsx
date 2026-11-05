import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { parse, startOfWeek, endOfWeek, format, isValid } from 'date-fns'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useTasks } from '../../context/TaskContext'

function CustomTooltip({ active, payload, label, isDark }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div
        className={`p-2.5 rounded-xl shadow-lg border text-xs space-y-1 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/50'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
        }`}
      >
        <div className="flex items-center justify-between gap-3 font-bold border-b pb-1 border-slate-100 dark:border-slate-800">
          <span>{data?.fullDate || label}</span>
          {data?.isSelected && (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-600 text-white font-semibold">
              Selected
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            Completed:
          </span>
          <span className="font-bold">{data?.completed ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
            Pending:
          </span>
          <span className="font-bold">{data?.pending ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          <span>Total:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {data?.total ?? 0}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function WeeklyActivityChart({ selectedDate }) {
  const { isDark } = useTheme()
  const { getWeekTaskActivity } = useTasks()

  // Calculate the 7-day Monday-to-Sunday dataset dynamically around selectedDate using real tasks
  const weekData = useMemo(() => {
    return getWeekTaskActivity(selectedDate)
  }, [getWeekTaskActivity, selectedDate])

  // Week range summary label (e.g. "Nov 2 – Nov 8, 2026")
  const weekRangeLabel = useMemo(() => {
    try {
      const parsed = parse(selectedDate, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        const start = startOfWeek(parsed, { weekStartsOn: 1 })
        const end = endOfWeek(parsed, { weekStartsOn: 1 })
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
      }
    } catch {
      // fallback
    }
    return 'Current Week'
  }, [selectedDate])

  // Aggregated weekly metrics
  const { totalCompleted, totalWeeklyTasks, weekCompletionRate } = useMemo(() => {
    const completed = weekData.reduce((acc, d) => acc + d.completed, 0)
    const total = weekData.reduce((acc, d) => acc + d.total, 0)
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      totalCompleted: completed,
      totalWeeklyTasks: total,
      weekCompletionRate: rate,
    }
  }, [weekData])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 sm:p-5 transition-colors">
      {/* Chart Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Weekly Activity
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              7-day velocity ({weekRangeLabel})
            </p>
          </div>
        </div>

        {/* Legend & Summary Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
            <span className="text-[11px]">Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700" />
            <span className="text-[11px]">Pending</span>
          </div>
          {totalWeeklyTasks > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
              {totalCompleted}/{totalWeeklyTasks} ({weekCompletionRate}%)
            </span>
          )}
        </div>
      </div>

      {/* Responsive Recharts Bar Canvas - Compact Height */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weekData}
            margin={{ top: 6, right: 6, left: -24, bottom: 0 }}
            barGap={3}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#334155' : '#f1f5f9'}
            />
            <XAxis
              dataKey="dayLabel"
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip isDark={isDark} />}
              cursor={{
                fill: isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(241, 245, 249, 0.7)',
              }}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#2563eb"
              radius={[3, 3, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              fill={isDark ? '#334155' : '#cbd5e1'}
              radius={[3, 3, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom compact context note */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{totalCompleted} tasks completed this week</span>
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Synchronized with selected date
        </span>
      </div>
    </div>
  )
}
