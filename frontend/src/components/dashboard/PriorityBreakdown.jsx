import { useMemo } from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieChartIcon, AlertCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const COLORS = {
  high: '#f43f5e', // rose-500
  medium: '#f59e0b', // amber-500
  low: '#3b82f6', // blue-500
}

export default function PriorityBreakdown({ tasks = [] }) {
  const { isDark } = useTheme()

  const { highCount, mediumCount, lowCount, total, chartData } = useMemo(() => {
    const high = tasks.filter((t) => t.priority === 'high').length
    const med = tasks.filter((t) => t.priority === 'medium').length
    const low = tasks.filter((t) => t.priority === 'low').length
    const totalCount = tasks.length

    const data = [
      { name: 'High', value: high, key: 'high', color: COLORS.high },
      { name: 'Medium', value: med, key: 'medium', color: COLORS.medium },
      { name: 'Low', value: low, key: 'low', color: COLORS.low },
    ].filter((item) => item.value > 0)

    return {
      highCount: high,
      mediumCount: med,
      lowCount: low,
      total: totalCount,
      chartData: data,
    }
  }, [tasks])

  const priorities = [
    {
      label: 'High Priority',
      key: 'high',
      count: highCount,
      colorClass: 'bg-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
      percentage: total > 0 ? Math.round((highCount / total) * 100) : 0,
    },
    {
      label: 'Medium Priority',
      key: 'medium',
      count: mediumCount,
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      percentage: total > 0 ? Math.round((mediumCount / total) * 100) : 0,
    },
    {
      label: 'Low Priority',
      key: 'low',
      count: lowCount,
      colorClass: 'bg-blue-500',
      textClass: 'text-blue-600 dark:text-blue-400',
      percentage: total > 0 ? Math.round((lowCount / total) * 100) : 0,
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Priority Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of scheduled objectives
            </p>
          </div>
        </div>

        {total > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {total} {total === 1 ? 'Task' : 'Tasks'}
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No priority data
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            0 tasks to categorize on this day.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recharts Donut */}
          <div className="h-36 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={144}>
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.key}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]
                      return (
                        <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md">
                          <span>
                            {data.name}: {data.value} (
                            {Math.round((data.value / total) * 100)}%)
                          </span>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Donut Center Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">
                {total}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2 pt-1">
            {priorities.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className={`w-2 h-2 rounded-full ${item.colorClass}`} />
                    {item.label}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {item.count}{' '}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      ({item.percentage}%)
                    </span>
                  </span>
                </div>
                {/* Micro Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${item.colorClass}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
