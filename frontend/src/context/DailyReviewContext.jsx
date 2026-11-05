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
import { reviewService } from '../services/reviewService'

const DailyReviewContext = createContext(undefined)

export function DailyReviewProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch reviews from backend whenever user logs in or authenticates
  const refreshReviews = useCallback(async () => {
    if (!isAuthenticated) {
      setReviews([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const fetchedReviews = await reviewService.getReviews()
      setReviews(fetchedReviews)
    } catch (err) {
      console.error('Failed to fetch reviews from backend:', err)
      setError(err.message || 'Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let isMounted = true

    const loadReviews = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setReviews([])
          setError(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const fetchedReviews = await reviewService.getReviews()
        if (isMounted) {
          setReviews(fetchedReviews)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch reviews from backend:', err)
          setError(err.message || 'Failed to load reviews.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReviews()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  /**
   * Get the review associated with a specific date (YYYY-MM-DD)
   */
  const getReviewByDate = useCallback(
    (dateString) => {
      if (!dateString) return null
      return reviews.find((r) => r.date === dateString) || null
    },
    [reviews]
  )

  /**
   * Saves or updates a daily review for a specific date using backend API
   */
  const saveReview = useCallback(
    async (reviewData) => {
      setError(null)
      try {
        const savedReview = await reviewService.saveOrUpdateReview(reviewData)
        if (savedReview) {
          setReviews((prev) => {
            const index = prev.findIndex((r) => r.date === savedReview.date)
            if (index >= 0) {
              const updated = [...prev]
              updated[index] = savedReview
              return updated
            }
            return [savedReview, ...prev]
          })
          return { success: true, review: savedReview }
        }
        return { success: false, error: 'Failed to save review.' }
      } catch (err) {
        const msg = err.message || 'Failed to save review.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  /**
   * Updates an existing review by ID using backend API
   */
  const updateReview = useCallback(
    async (reviewId, updates) => {
      setError(null)
      try {
        const updatedReview = await reviewService.updateReview(reviewId, updates)
        if (updatedReview) {
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? updatedReview : r))
          )
          return { success: true, review: updatedReview }
        }
        return { success: false, error: 'Review not found.' }
      } catch (err) {
        const msg = err.message || 'Failed to update review.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  /**
   * Deletes a review by ID using backend API
   */
  const deleteReview = useCallback(
    async (reviewId) => {
      setError(null)
      try {
        await reviewService.deleteReview(reviewId)
        setReviews((prev) => prev.filter((r) => r.id !== reviewId))
        return { success: true }
      } catch (err) {
        const msg = err.message || 'Failed to delete review.'
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      reviews,
      loading,
      error,
      refreshReviews,
      getReviewByDate,
      saveReview,
      updateReview,
      deleteReview,
    }),
    [reviews, loading, error, refreshReviews, getReviewByDate, saveReview, updateReview, deleteReview]
  )

  return (
    <DailyReviewContext.Provider value={value}>
      {children}
    </DailyReviewContext.Provider>
  )
}

export function useDailyReview() {
  const context = useContext(DailyReviewContext)
  if (!context) {
    throw new Error('useDailyReview must be used within a DailyReviewProvider')
  }
  return context
}

export default DailyReviewContext
