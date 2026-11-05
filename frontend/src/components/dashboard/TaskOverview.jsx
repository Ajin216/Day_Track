import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ListTodo,
  Tag,
  Sparkles,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const priorityConfig = {
  high: {
    label: 'High',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60',
    dotClass: 'bg-rose-500',
  },
  medium: {
    label: 'Medium',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60',
    dotClass: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
}

/**
 * Returns dynamic motivational copy and tone based on completion percentage.
 */
function getMotivationalState(total, completed) {
  if (total === 0) {
    return {
      message: 'No tasks planned yet for this day. Plan an objective to get started.',
      colorClass: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60',
      icon: Sparkles,
      iconColor: 'text-slate-400 dark:text-slate-500',
    }
  }

  const rate = Math.round((completed / total) * 100)

  if (rate === 0) {
    return {
      message: 'Every great day starts with one task.',
      colorClass: 'text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/50',
      icon: Sparkles,
      iconColor: 'text-blue-500 dark:text-blue-400',
    }
  }

  if (rate < 50) {
    return {
      message: 'Good start. Keep the momentum going.',
      colorClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/50',
      icon: Sparkles,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
    }
  }

  if (rate < 75) {
    return {
      message: 'Halfway there. Keep pushing!',
      colorClass: 'text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/50',
      icon: Trophy,
      iconColor: 'text-amber-500 dark:text-amber-400',
    }
  }

  if (rate < 100) {
    return {
      message: 'Almost there. Finish strong.',
      colorClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/50',
      icon: Trophy,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    }
  }

  return {
    message: "Amazing work. You completed today's tasks!",
    colorClass: 'text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-800/80 font-semibold',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  }
}

export default function TaskOverview({ tasks = [], onToggleComplete, isReadOnly = false }) {
  const [showAllTasks, setShowAllTasks] = useState(false)
  const INITIAL_LIMIT = 5

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const pendingTasks = totalTasks - completedTasks

  // Completion percentage (null when 0 tasks to avoid false 0% productivity)
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null

  // Motivational state
  const motivation = useMemo(
    () => getMotivationalState(totalTasks, completedTasks),
    [totalTasks, completedTasks]
  )
  const MotivationIcon = motivation.icon

  // Sort tasks: pending first, then completed; within each group, preserve order
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0
      return a.completed ? 1 : -1
    })
  }, [tasks])

  const visibleTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, INITIAL_LIMIT)
  const hasMoreTasks = sortedTasks.length > INITIAL_LIMIT

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* 1. Header with Visual Icon, Title, and Action Link */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Today&apos;s Task Overview
              </h2>
              {totalTasks > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                  {completedTasks}/{totalTasks}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Primary focus and milestone tracking for the active day
            </p>
          </div>
        </div>

        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 transition-colors self-start sm:self-auto"
        >
          <span>View All in My Tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Motivational Banner & Dynamic Progress Centerpiece */}
      <div className="px-5 sm:px-6 pt-5 pb-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80">
        {/* Dynamic Motivational Bar */}
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed transition-all ${motivation.colorClass}`}
        >
          <MotivationIcon className={`w-4 h-4 flex-shrink-0 ${motivation.iconColor}`} />
          <span className="font-medium">{motivation.message}</span>
        </div>

        {/* Prominent Progress Bar and Metrics (shown when tasks exist) */}
        {totalTasks > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Daily Completion Velocity
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {completedTasks}
                  </strong>{' '}
                  completed
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {pendingTasks}
                  </strong>{' '}
                  remaining
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {completionPercentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Track */}
            <div className="relative w-full h-3 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  completionPercentage === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
                role="progressbar"
                aria-valuenow={completionPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Today's task completion progress"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Task List or Encouraging Empty State */}
      {totalTasks === 0 ? (
        <div className="p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No tasks scheduled for this day
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Take a moment to plan your key action items, build positive daily momentum, or switch to another date on the calendar.
          </p>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Create First Task</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {visibleTasks.map((task) => {
            const priorityInfo = priorityConfig[task.priority] || priorityConfig.medium

            return (
              <div
                key={task.id}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  task.completed
                    ? 'bg-slate-50/40 dark:bg-slate-900/30'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Left: Interactive Checkbox & Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && onToggleComplete && onToggleComplete(task.id)}
                    aria-label={
                      isReadOnly
                        ? `Task "${task.title}" is read-only`
                        : task.completed
                          ? `Mark task "${task.title}" as pending`
                          : `Mark task "${task.title}" as completed`
                    }
                    title={isReadOnly ? 'Historical tasks are read-only' : undefined}
                    className={`pt-0.5 flex-shrink-0 transition-colors ${
                      isReadOnly
                        ? 'text-slate-400 cursor-not-allowed opacity-80'
                        : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-full'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug transition-all ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                          : 'font-semibold text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Description preview if present */}
                    {task.description && !task.completed && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}

                    {/* Mobile Metadata Row */}
                    <div className="flex sm:hidden items-center gap-2 mt-1.5 flex-wrap">
                      {task.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {task.category}
                        </span>
                      )}
                      {task.time && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges (Priority, Category, Time, Status) */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
                  {/* Category Pill (Desktop/tablet) */}
                  {task.category && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {task.category}
                    </span>
                  )}

                  {/* Scheduled Time (Desktop/tablet) */}
                  {task.time && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {task.time}
                    </span>
                  )}

                  {/* Priority Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${priorityInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
                    {priorityInfo.label}
                  </span>

                  {/* Status Indicator */}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      task.completed
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {task.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Expand/Collapse or View All Bar if task count exceeds initial limit */}
          {hasMoreTasks && (
            <div className="p-3.5 bg-slate-50/60 dark:bg-slate-900/50 flex items-center justify-between text-xs px-5 sm:px-6">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Showing {visibleTasks.length} of {totalTasks} tasks for this day
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllTasks((prev) => !prev)}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span>{showAllTasks ? 'Show fewer' : `Show all ${totalTasks}`}</span>
                  {showAllTasks ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <Link
                  to="/tasks"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Manage tasks</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
