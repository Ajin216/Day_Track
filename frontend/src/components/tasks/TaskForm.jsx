import { useState } from 'react'
import {
  Tag,
  Calendar,
  Clock,
  AlertCircle,
  Flag,
  AlignLeft,
} from 'lucide-react'

const CATEGORY_PRESETS = [
  'General',
  'Work',
  'Personal',
  'Engineering',
  'Design',
  'Health',
  'Learning',
  'Finance',
]

const PRIORITIES = [
  {
    id: 'low',
    label: 'Low',
    color: 'text-blue-600 dark:text-blue-400',
    selectedBg: 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300',
  },
  {
    id: 'medium',
    label: 'Medium',
    color: 'text-amber-600 dark:text-amber-400',
    selectedBg: 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:border-amber-500 dark:text-amber-300',
  },
  {
    id: 'high',
    label: 'High',
    color: 'text-rose-600 dark:text-rose-400',
    selectedBg: 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:border-rose-500 dark:text-rose-300',
  },
]

export default function TaskForm({
  initialData = null,
  defaultDate = '',
  onSubmit,
  onCancel,
  submitLabel = 'Save Task',
}) {
  const initialCategoryIsPreset = CATEGORY_PRESETS.includes(initialData?.category)
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [priority, setPriority] = useState(initialData?.priority || 'medium')
  const [category, setCategory] = useState(() => {
    if (!initialData?.category) return 'General'
    return initialCategoryIsPreset ? initialData.category : 'Other'
  })
  const [customCategory, setCustomCategory] = useState(() => {
    if (initialData?.category && !initialCategoryIsPreset) {
      return initialData.category
    }
    return ''
  })
  const [date, setDate] = useState(initialData?.date || defaultDate || '')
  const [time, setTime] = useState(initialData?.time || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Task title is required.')
      return
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please select a valid date (YYYY-MM-DD).')
      return
    }

    const finalCategory =
      category === 'Other'
        ? (customCategory.trim() || 'General')
        : (category || 'General')

    setError('')
    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      category: finalCategory,
      date,
      time: time.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="task-title"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Task Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError('')
          }}
          placeholder="e.g. Complete quarterly roadmap review"
          autoFocus
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="task-description"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        >
          <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
          Description (Optional)
        </label>
        <textarea
          id="task-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add context, deliverables, or checklist notes..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
        />
      </div>

      {/* Priority selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-slate-400" />
          Priority
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => {
            const isSelected = priority === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none ${
                  isSelected
                    ? p.selectedBg + ' shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Date & Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date */}
        <div>
          <label
            htmlFor="task-date"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Assigned Date <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Time */}
        <div>
          <label
            htmlFor="task-time"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Scheduled Time (Optional)
          </label>
          <input
            id="task-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Category selection */}
      <div>
        <label
          htmlFor="task-category-select"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Category
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {CATEGORY_PRESETS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCategory('Other')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              category === 'Other'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Custom...
          </button>
        </div>

        {category === 'Other' && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Type custom category name..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 mt-1"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
