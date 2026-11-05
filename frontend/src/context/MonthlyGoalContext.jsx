/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'
import { useSelectedDate } from './SelectedDateContext'
import { goalService } from '../services/goalService'

const MonthlyGoalContext = createContext(undefined)

export function MonthlyGoalProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const { selectedDate } = useSelectedDate()

  // Derive active month (YYYY-MM) from selectedDate or fallback to current local month
  const activeMonth = useMemo(() => {
    if (selectedDate && typeof selectedDate === 'string' && selectedDate.length >= 7) {
      return selectedDate.slice(0, 7)
    }
    return new Date().toISOString().slice(0, 7)
  }, [selectedDate])

  const [activeGoal, setActiveGoal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modal control state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalGoal, setModalGoal] = useState(null)

  // Load the active goal for the currently selected month
  const refreshActiveGoal = useCallback(
    async (targetMonth = activeMonth) => {
      if (!isAuthenticated) {
        setActiveGoal(null)
        setLoading(false)
        return null
      }

      setLoading(true)
      setError(null)
      try {
        const goal = await goalService.getActiveGoal(targetMonth)
        setActiveGoal(goal)
        return goal
      } catch (err) {
        console.error('Failed to load active monthly goal:', err)
        setError(err.message || 'Failed to load monthly goal.')
        return null
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated, activeMonth]
  )

  // Automatically fetch goal whenever active month changes or user logs in
  useEffect(() => {
    let isMounted = true

    const loadGoal = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setActiveGoal(null)
          setError(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const goal = await goalService.getActiveGoal(activeMonth)
        if (isMounted) {
          setActiveGoal(goal)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load monthly goal:', err)
          setError(err.message || 'Failed to load monthly goal.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadGoal()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, activeMonth])

  // Create a new monthly goal
  const createGoal = useCallback(
    async (goalData) => {
      setError(null)
      try {
        const payload = {
          ...goalData,
          month: goalData.month || activeMonth,
        }
        const created = await goalService.createGoal(payload)
        setActiveGoal(created)
        return { success: true, goal: created }
      } catch (err) {
        if (err.status === 409) {
          return {
            success: false,
            conflict: true,
            existingGoal: err.data?.data?.existingGoal || activeGoal,
            message: err.message,
          }
        }
        const msg = err.message || 'Failed to create monthly goal'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    [activeMonth, activeGoal]
  )

  // Update an existing goal
  const updateGoal = useCallback(
    async (id, updates) => {
      setError(null)
      try {
        const updated = await goalService.updateGoal(id, updates)
        setActiveGoal((prev) => (prev?._id === id || prev?.id === id ? updated : prev))
        return { success: true, goal: updated }
      } catch (err) {
        const msg = err.message || 'Failed to update monthly goal'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  // Update manual progress percentage directly
  const updateProgress = useCallback(
    async (progress) => {
      const goalId = activeGoal?._id || activeGoal?.id
      if (!goalId) return { success: false, error: 'No active goal' }
      return updateGoal(goalId, { progress: Number(progress) })
    },
    [activeGoal, updateGoal]
  )

  // Complete a goal
  const completeGoal = useCallback(
    async (id = (activeGoal?._id || activeGoal?.id)) => {
      if (!id) return { success: false, error: 'No goal ID provided' }
      setError(null)
      try {
        const completed = await goalService.completeGoal(id)
        setActiveGoal((prev) => (prev?._id === id || prev?.id === id ? completed : prev))
        return { success: true, goal: completed }
      } catch (err) {
        const msg = err.message || 'Failed to complete monthly goal'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    [activeGoal]
  )

  // Delete a goal
  const deleteGoal = useCallback(
    async (id = (activeGoal?._id || activeGoal?.id)) => {
      if (!id) return { success: false, error: 'No goal ID provided' }
      setError(null)
      try {
        await goalService.deleteGoal(id)
        setActiveGoal((prev) => (prev?._id === id || prev?.id === id ? null : prev))
        return { success: true }
      } catch (err) {
        const msg = err.message || 'Failed to delete monthly goal'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    [activeGoal]
  )

  // Modal open / close helpers
  const openCreateModal = useCallback(() => {
    setModalGoal(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (goal = activeGoal) => {
      setModalGoal(goal)
      setIsModalOpen(true)
    },
    [activeGoal]
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setModalGoal(null)
  }, [])

  const value = useMemo(
    () => ({
      activeMonth,
      activeGoal,
      loading,
      error,
      isModalOpen,
      modalGoal,
      refreshActiveGoal,
      createGoal,
      updateGoal,
      updateProgress,
      completeGoal,
      deleteGoal,
      openCreateModal,
      openEditModal,
      closeModal,
    }),
    [
      activeMonth,
      activeGoal,
      loading,
      error,
      isModalOpen,
      modalGoal,
      refreshActiveGoal,
      createGoal,
      updateGoal,
      updateProgress,
      completeGoal,
      deleteGoal,
      openCreateModal,
      openEditModal,
      closeModal,
    ]
  )

  return (
    <MonthlyGoalContext.Provider value={value}>
      {children}
    </MonthlyGoalContext.Provider>
  )
}

export function useMonthlyGoal() {
  const context = useContext(MonthlyGoalContext)
  if (!context) {
    throw new Error('useMonthlyGoal must be used within a MonthlyGoalProvider')
  }
  return context
}

export default MonthlyGoalContext
