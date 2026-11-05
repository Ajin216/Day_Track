import { useState, useMemo, useCallback } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  ListTodo,
  Lock,
} from 'lucide-react'
import { useSelectedDate } from '../context/SelectedDateContext'
import { useTasks } from '../context/TaskContext'
import DateIndicator from '../components/common/DateIndicator'
import TaskCard from '../components/tasks/TaskCard'
import TaskModal from '../components/tasks/TaskModal'
import TaskForm from '../components/tasks/TaskForm'
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal'
import RescheduleModal from '../components/tasks/RescheduleModal'

export default function Tasks() {
  const { selectedDate, setSelectedDate, isHistorical } = useSelectedDate()
  const {
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    rescheduleTask,
    getTasksByDate,
  } = useTasks()

  // Modals state
  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [activeTask, setActiveTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [taskToReschedule, setTaskToReschedule] = useState(null)

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'pending'
  const [priorityFilter, setPriorityFilter] = useState('all') // 'all' | 'high' | 'medium' | 'low'
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | categoryName
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'priority-desc' | 'priority-asc'

  // Tasks belonging strictly to selectedDate
  const dateTasks = useMemo(() => {
    return getTasksByDate(selectedDate)
  }, [getTasksByDate, selectedDate])

  // Aggregate metrics for selectedDate
  const totalCount = dateTasks.length
  const completedCount = dateTasks.filter((t) => t.completed).length
  const pendingCount = totalCount - completedCount
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : null

  // Distinct categories available in this date's tasks
  const availableCategories = useMemo(() => {
    const cats = new Set(dateTasks.map((t) => t.category).filter(Boolean))
    return Array.from(cats)
  }, [dateTasks])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return dateTasks
      .filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchTitle = task.title.toLowerCase().includes(q)
          const matchDesc = task.description?.toLowerCase().includes(q)
          if (!matchTitle && !matchDesc) return false
        }

        // Status filter
        if (statusFilter === 'completed' && !task.completed) return false
        if (statusFilter === 'pending' && task.completed) return false

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false

        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        }
        if (sortBy === 'priority-desc') {
          const weights = { high: 3, medium: 2, low: 1 }
          return (weights[b.priority] || 0) - (weights[a.priority] || 0)
        }
        if (sortBy === 'priority-asc') {
          const weights = { high: 3, medium: 2, low: 1 }
          return (weights[a.priority] || 0) - (weights[b.priority] || 0)
        }
        return 0
      })
  }, [dateTasks, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy])

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all'

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setSortBy('newest')
  }, [])

  // Handlers
  const handleOpenCreate = () => {
    if (isHistorical) return
    setActiveTask(null)
    setModalMode('create')
  }

  const handleOpenEdit = (task) => {
    if (isHistorical) return
    setActiveTask(task)
    setModalMode('edit')
  }

  const handleCloseModal = () => {
    setModalMode(null)
    setActiveTask(null)
  }

  const handleSaveTask = async (formData) => {
    if (isHistorical) return
    if (modalMode === 'create') {
      await addTask(formData)
      // When creating a task for a different date, switch active selectedDate to that date so it is displayed immediately
      if (formData.date && formData.date !== selectedDate && setSelectedDate) {
        setSelectedDate(formData.date)
      }
    } else if (modalMode === 'edit' && activeTask) {
      await updateTask(activeTask.id, formData)
    }
    handleCloseModal()
  }

  const handleOpenDelete = (task) => {
    if (isHistorical) return
    setTaskToDelete(task)
  }

  const handleConfirmDelete = async () => {
    if (isHistorical) return
    if (taskToDelete) {
      await deleteTask(taskToDelete.id)
      setTaskToDelete(null)
    }
  }

  const handleOpenReschedule = (task) => {
    if (isHistorical) return
    setTaskToReschedule(task)
  }

  const handleConfirmReschedule = async (newDate) => {
    if (isHistorical) return
    if (taskToReschedule) {
      await rescheduleTask(taskToReschedule.id, newDate)
      setTaskToReschedule(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            My Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize action items, prioritize objectives, and track execution status for your selected date.
          </p>
        </div>

        {isHistorical ? (
          <div
            title="Tasks cannot be created or modified for historical dates"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed select-none self-start sm:self-auto"
          >
            <Lock className="w-4 h-4" />
            <span>Read-Only</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Shared Active Date Indicator */}
      <DateIndicator />

      {/* Historical Date Read-Only Banner */}
      {isHistorical && (
        <div className="flex items-center gap-3 p-3.5 sm:px-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">Historical Records (Read-Only):</span>{' '}
            <span className="text-amber-800/90 dark:text-amber-300/80">
              Tasks assigned to previous dates are preserved in archive mode and cannot be added, edited, rescheduled, completed, or deleted.
            </span>
          </div>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalCount === 0 ? 'No tasks planned' : `${totalCount} planned for this day`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {completedCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedCount === 1 ? '1 milestone finished' : `${completedCount} milestones finished`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {pendingCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {pendingCount === 0 ? 'No pending items' : `${pendingCount} items remaining`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalCount === 0 ? 'No tasks yet' : `${completionRate}%`}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalCount === 0 ? 'Empty day' : `${completedCount} of ${totalCount} completed`}
          </p>
        </div>
      </div>

      {/* Filter and Toolbar Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear All Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-end md:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Sort Control */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tasks by"
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List or Clean Empty States */}
      {totalCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
            {isHistorical ? (
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isHistorical ? 'No tasks recorded for this date' : 'No tasks scheduled for this date'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {isHistorical
              ? 'No tasks were logged on this past date. Historical dates are preserved as read-only records.'
              : 'Create action items, assign priorities, and keep track of your daily execution momentum.'}
          </p>
          {!isHistorical && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Task
            </button>
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No tasks match your filters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
            Try adjusting your search query, priority filter, or status toggles.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isReadOnly={isHistorical}
              onToggleComplete={isHistorical ? undefined : toggleTaskCompletion}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onReschedule={handleOpenReschedule}
            />
          ))}
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={modalMode !== null}
        onClose={handleCloseModal}
        title={modalMode === 'edit' ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          key={activeTask ? activeTask.id : 'new-' + selectedDate}
          initialData={activeTask}
          defaultDate={selectedDate}
          onSubmit={handleSaveTask}
          onCancel={handleCloseModal}
          submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Create Task'}
        />
      </TaskModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={taskToDelete !== null}
        task={taskToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        key={taskToReschedule ? taskToReschedule.id : 'reschedule'}
        isOpen={taskToReschedule !== null}
        task={taskToReschedule}
        onConfirm={handleConfirmReschedule}
        onCancel={() => setTaskToReschedule(null)}
      />
    </div>
  )
}
