import { useState } from 'react'
import { Database, UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { taskService } from '../../services/taskService'
import { reviewService } from '../../services/reviewService'
import { useTasks } from '../../context/TaskContext'
import { useDailyReview } from '../../context/DailyReviewContext'

const TASKS_STORAGE_KEY = 'daytrack_tasks'
const REVIEWS_STORAGE_KEY = 'daytrack_reviews'

export default function DataMigrationBanner() {
  const { refreshTasks } = useTasks()
  const { refreshReviews } = useDailyReview()

  const [localTasks, setLocalTasks] = useState(() => {
    try {
      const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY)
      const parsed = rawTasks ? JSON.parse(rawTasks) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [localReviews, setLocalReviews] = useState(() => {
    try {
      const rawReviews = localStorage.getItem(REVIEWS_STORAGE_KEY)
      const parsed = rawReviews ? JSON.parse(rawReviews) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [isDismissed, setIsDismissed] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState(null) // { success: true/false, message: string }

  const totalCount = localTasks.length + localReviews.length

  if (isDismissed || totalCount === 0) {
    return null
  }

  const handleImport = async () => {
    setIsMigrating(true)
    setMigrationStatus(null)

    let tasksImported = 0
    let reviewsImported = 0
    let remainingTasks = [...localTasks]
    let remainingReviews = [...localReviews]

    try {
      // 1. Import Tasks
      for (const t of localTasks) {
        try {
          await taskService.createTask({
            title: t.title,
            description: t.description || '',
            date: t.date,
            priority: t.priority || 'medium',
            category: t.category || 'General',
            time: t.time || null,
            completed: Boolean(t.completed),
          })
          tasksImported++
          remainingTasks = remainingTasks.filter((item) => item.id !== t.id)
          // Update localStorage incrementally after each successful item
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(remainingTasks))
        } catch (err) {
          console.warn(`Failed to migrate task "${t.title}":`, err)
        }
      }

      // 2. Import Reviews
      for (const r of localReviews) {
        try {
          await reviewService.saveOrUpdateReview({
            date: r.date,
            accomplishments: r.accomplishments || '',
            improvements: r.improvements || '',
            tomorrowFocus: r.tomorrowFocus || '',
            mood: r.mood || 'Good',
          })
          reviewsImported++
          remainingReviews = remainingReviews.filter((item) => item.id !== r.id)
          localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(remainingReviews))
        } catch (err) {
          console.warn(`Failed to migrate review for date "${r.date}":`, err)
        }
      }

      // Cleanup keys if completely empty
      if (remainingTasks.length === 0) {
        localStorage.removeItem(TASKS_STORAGE_KEY)
      }
      if (remainingReviews.length === 0) {
        localStorage.removeItem(REVIEWS_STORAGE_KEY)
      }

      setLocalTasks(remainingTasks)
      setLocalReviews(remainingReviews)

      // Refresh application context data
      await Promise.all([refreshTasks(), refreshReviews()])

      setMigrationStatus({
        success: true,
        message: `Successfully migrated ${tasksImported} task${tasksImported !== 1 ? 's' : ''} and ${reviewsImported} review${reviewsImported !== 1 ? 's' : ''} to your account.`,
      })

      setTimeout(() => {
        setIsDismissed(true)
      }, 3500)
    } catch (err) {
      setMigrationStatus({
        success: false,
        message: `Migration partially completed: ${err.message || 'Check logs for details.'}`,
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-600 text-white flex-shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Local Data Detected
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              {totalCount} item{totalCount !== 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            You have {localTasks.length} task{localTasks.length !== 1 ? 's' : ''} and{' '}
            {localReviews.length} review{localReviews.length !== 1 ? 's' : ''} stored locally on this device. Would you like to import them to your account?
          </p>

          {migrationStatus && (
            <div
              className={`mt-2 text-xs font-semibold flex items-center gap-1.5 ${
                migrationStatus.success
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {migrationStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{migrationStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          disabled={isMigrating}
          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5 inline mr-1" />
          Dismiss
        </button>

        <button
          type="button"
          onClick={handleImport}
          disabled={isMigrating}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
        >
          {isMigrating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Data</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
