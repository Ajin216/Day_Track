/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import {
  parse,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isValid,
} from 'date-fns'
import { useAuth } from './AuthContext'
import { taskService } from '../services/taskService'

const TaskContext = createContext(undefined)

export function TaskProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch tasks from backend whenever user logs in or authenticates
  const refreshTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setTasks([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const fetchedTasks = await taskService.getTasks()
      setTasks(fetchedTasks)
    } catch (err) {
      console.error('Failed to fetch tasks from backend:', err)
      setError(err.message || 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let isMounted = true

    const loadTasks = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setTasks([])
          setError(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const fetchedTasks = await taskService.getTasks()
        if (isMounted) {
          setTasks(fetchedTasks)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch tasks from backend:', err)
          setError(err.message || 'Failed to load tasks.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTasks()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  /**
   * Add a new task using backend API
   */
  const addTask = useCallback(
    async (taskInput) => {
      setError(null)
      try {
        const createdTask = await taskService.createTask(taskInput)
        if (createdTask) {
          setTasks((prev) => [createdTask, ...prev])
          return { success: true, task: createdTask }
        }
        return { success: false, error: 'Failed to create task.' }
      } catch (err) {
        const msg = err.message || 'Failed to create task.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  /**
   * Update an existing task using backend API
   */
  const updateTask = useCallback(
    async (taskId, updates) => {
      setError(null)
      try {
        const updatedTask = await taskService.updateTask(taskId, updates)
        if (updatedTask) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? updatedTask : t))
          )
          return { success: true, task: updatedTask }
        }
        return { success: false, error: 'Task not found.' }
      } catch (err) {
        const msg = err.message || 'Failed to update task.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  /**
   * Delete a task using backend API
   */
  const deleteTask = useCallback(
    async (taskId) => {
      setError(null)
      try {
        await taskService.deleteTask(taskId)
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        return { success: true }
      } catch (err) {
        const msg = err.message || 'Failed to delete task.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  /**
   * Toggle completion status of a task using backend API
   */
  const toggleTaskCompletion = useCallback(
    async (taskId) => {
      const target = tasks.find((t) => t.id === taskId)
      if (!target) return

      const nextCompleted = !target.completed
      await updateTask(taskId, { completed: nextCompleted })
    },
    [tasks, updateTask]
  )

  /**
   * Reschedule a task to a new date using backend API
   */
  const rescheduleTask = useCallback(
    async (taskId, newDate) => {
      return updateTask(taskId, { date: newDate })
    },
    [updateTask]
  )

  /**
   * Filter tasks by a specific date
   */
  const getTasksByDate = useCallback(
    (dateString) => {
      if (!dateString) return []
      return tasks.filter((task) => task.date === dateString)
    },
    [tasks]
  )

  /**
   * Get 7-day Monday-to-Sunday weekly activity breakdown for the week containing selectedDateString
   */
  const getWeekTaskActivity = useCallback(
    (selectedDateString) => {
      let baseDate = new Date()
      if (selectedDateString && typeof selectedDateString === 'string') {
        const parsed = parse(selectedDateString, 'yyyy-MM-dd', new Date())
        if (isValid(parsed)) {
          baseDate = parsed
        }
      }

      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

      return days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const dayTasks = tasks.filter((t) => t.date === dateKey)
        const total = dayTasks.length
        const completed = dayTasks.filter((t) => t.completed).length
        const pending = total - completed

        return {
          date: dateKey,
          dayLabel: format(day, 'EEE d'),
          weekday: format(day, 'EEE'),
          dayOfMonth: format(day, 'd'),
          fullDate: format(day, 'EEEE, MMM d, yyyy'),
          completed,
          pending,
          total,
          isSelected: dateKey === selectedDateString,
        }
      })
    },
    [tasks]
  )

  const value = useMemo(
    () => ({
      tasks,
      loading,
      error,
      refreshTasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      rescheduleTask,
      getTasksByDate,
      getWeekTaskActivity,
    }),
    [
      tasks,
      loading,
      error,
      refreshTasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      rescheduleTask,
      getTasksByDate,
      getWeekTaskActivity,
    ]
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}

export default TaskContext
