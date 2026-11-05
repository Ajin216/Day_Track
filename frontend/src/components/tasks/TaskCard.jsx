import { useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Pencil,
  Trash2,
  CalendarSync,
  Lock,
} from 'lucide-react'
import { parse, format, isValid } from 'date-fns'

const priorityStyles = {
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

export default function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onReschedule,
  isReadOnly = false,
}) {
  const priorityInfo = priorityStyles[task.priority] || priorityStyles.medium

  const formattedDate = useMemo(() => {
    try {
      const parsed = parse(task.date, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'MMM d, yyyy')
      }
    } catch {
      // fallback
    }
    return task.date
  }, [task.date])

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
        task.completed
          ? 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Completion toggle + Title & Description */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => !isReadOnly && onToggleComplete && onToggleComplete(task.id)}
            aria-label={
              isReadOnly
                ? `Task "${task.title}" is read-only`
                : task.completed
                  ? 'Mark incomplete'
                  : 'Mark completed'
            }
            title={isReadOnly ? 'Historical tasks are read-only' : undefined}
            className={`pt-0.5 flex-shrink-0 transition-colors focus:outline-none ${
              isReadOnly
                ? 'cursor-not-allowed opacity-80'
                : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`text-xs mt-1 leading-relaxed break-words ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-500 line-through'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges & Metadata */}
            <div className="flex items-center flex-wrap gap-2 mt-3 text-xs">
              {/* Priority */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${priorityInfo.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
                {priorityInfo.label}
              </span>

              {/* Category */}
              {task.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  {task.category}
                </span>
              )}

              {/* Date */}
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formattedDate}
              </span>

              {/* Time */}
              {task.time && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {task.time}
                </span>
              )}

              {/* Status pill */}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  task.completed
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {task.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons (hidden or disabled in read-only mode) */}
        {isReadOnly ? (
          <div
            title="Historical records are read-only"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 select-none self-start flex-shrink-0"
          >
            <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Archived</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 self-start flex-shrink-0">
            <button
              type="button"
              onClick={() => onReschedule(task)}
              title="Reschedule task to another date"
              aria-label="Reschedule task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CalendarSync className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Edit task"
              aria-label="Edit task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task)}
              title="Delete task"
              aria-label="Delete task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
