import { useMemo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PieChart as PieChartIcon, AlertCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const PRIORITY_COLORS = {
  high: '#f43f5e', // rose-500
  medium: '#f59e0b', // amber-500
  low: '#3b82f6', // blue-500
}

function PriorityTooltip({ active, payload, isDark }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div
        className={`p-2.5 rounded-xl shadow-lg border text-xs space-y-1 min-w-[140px] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/60'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5 capitalize">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          {data.name} Priority
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Tasks:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{data.value}</span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Completed:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {data.completed ?? 0}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span>Share:</span>
          <span className="font-bold">{data.percentage}%</span>
        </div>
      </div>
    )
  }
  return null
}

export default function PriorityChart({ priorityDistribution = {} }) {
  const { isDark } = useTheme()

  const { counts = {}, percentages = {}, breakdown = [] } = priorityDistribution

  const totalTasks =
    (counts.high || 0) + (counts.medium || 0) + (counts.low || 0)

  const chartData = useMemo(() => {
    return [
      {
        name: 'High',
        key: 'high',
        value: counts.high || 0,
        completed: breakdown.find((b) => b.priority === 'high')?.completed || 0,
        percentage: percentages.high || 0,
        color: PRIORITY_COLORS.high,
      },
      {
        name: 'Medium',
        key: 'medium',
        value: counts.medium || 0,
        completed: breakdown.find((b) => b.priority === 'medium')?.completed || 0,
        percentage: percentages.medium || 0,
        color: PRIORITY_COLORS.medium,
      },
      {
        name: 'Low',
        key: 'low',
        value: counts.low || 0,
        completed: breakdown.find((b) => b.priority === 'low')?.completed || 0,
        percentage: percentages.low || 0,
        color: PRIORITY_COLORS.low,
      },
    ].filter((item) => item.value > 0)
  }, [counts, percentages, breakdown])

  const prioritiesList = [
    {
      label: 'High Priority',
      key: 'high',
      count: counts.high || 0,
      percentage: percentages.high || 0,
      color: PRIORITY_COLORS.high,
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    },
    {
      label: 'Medium Priority',
      key: 'medium',
      count: counts.medium || 0,
      percentage: percentages.medium || 0,
      color: PRIORITY_COLORS.medium,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      label: 'Low Priority',
      key: 'low',
      count: counts.low || 0,
      percentage: percentages.low || 0,
      color: PRIORITY_COLORS.low,
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Priority Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Urgency breakdown for the selected month
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>

        {totalTasks === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              No tasks logged in this month.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Priority breakdown will appear once tasks are created.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="w-40 h-40 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip content={<PriorityTooltip isDark={isDark} />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {totalTasks}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Tasks</span>
              </div>
            </div>

            {/* Priority Items List */}
            <div className="flex-1 w-full space-y-2.5">
              {prioritiesList.map((p) => (
                <div
                  key={p.key}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {p.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {p.count}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${p.badgeClass}`}>
                      {p.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        Categorized by assigned priority level.
      </div>
    </div>
  )
}

