import { useState, useMemo } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  PenLine,
  Lock,
} from 'lucide-react'
import { useSelectedDate } from '../context/SelectedDateContext'
import { useDailyReview } from '../context/DailyReviewContext'
import DateIndicator from '../components/common/DateIndicator'
import ReviewForm from '../components/journal/ReviewForm'
import ReviewCard from '../components/journal/ReviewCard'
import DeleteReviewModal from '../components/journal/DeleteReviewModal'

export default function Journal() {
  const { selectedDate, isHistorical } = useSelectedDate()
  const { getReviewByDate, saveReview, deleteReview } = useDailyReview()

  // Track whether we are actively editing an existing review
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  // Active review for selectedDate
  const currentReview = useMemo(() => {
    return getReviewByDate(selectedDate)
  }, [getReviewByDate, selectedDate])

  const handleSave = async (formData) => {
    if (isHistorical) return
    const res = await saveReview(formData)
    if (res.success) {
      setIsEditing(false)
      setFeedbackMessage('Daily review saved successfully.')
      setTimeout(() => setFeedbackMessage(''), 4000)
    }
  }

  const handleDelete = async () => {
    if (isHistorical) return
    if (currentReview) {
      await deleteReview(currentReview.id)
      setIsDeleteModalOpen(false)
      setIsEditing(false)
      setFeedbackMessage('Daily review deleted.')
      setTimeout(() => setFeedbackMessage(''), 4000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Daily Journal &amp; Self-Review
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reflect on accomplishments, identify growth opportunities, and set intentional focus for tomorrow.
          </p>
        </div>

        {isHistorical ? (
          <div
            title="Historical journals are read-only"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed select-none self-start sm:self-auto"
          >
            <Lock className="w-4 h-4" />
            <span>Read-Only</span>
          </div>
        ) : (
          currentReview &&
          !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <PenLine className="w-4 h-4" />
              Edit Review
            </button>
          )
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
              Daily reflections for previous dates are preserved in archive mode and cannot be created, modified, or deleted.
            </span>
          </div>
        </div>
      )}

      {/* Review Status Banner */}
      <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          {currentReview ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : isHistorical ? (
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {currentReview
                ? isHistorical
                  ? 'Review Completed for this Date (Read-Only)'
                  : 'Review Completed for this Date'
                : isHistorical
                  ? 'No Review Was Logged on this Past Date'
                  : 'No Review Logged Yet for this Date'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentReview
                ? `Logged with mood: ${currentReview.mood}`
                : isHistorical
                  ? 'Historical dates cannot be reviewed retroactively.'
                  : 'Take a few minutes to conduct your evening reflection.'}
            </div>
          </div>
        </div>

        {feedbackMessage && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            {feedbackMessage}
          </span>
        )}
      </div>

      {/* Main Review Body */}
      {currentReview && !isEditing ? (
        <ReviewCard
          review={currentReview}
          isReadOnly={isHistorical}
          onEdit={() => !isHistorical && setIsEditing(true)}
          onDelete={() => !isHistorical && setIsDeleteModalOpen(true)}
        />
      ) : isHistorical ? (
        /* Historical Read-Only Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Journal Recorded for this Date
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            No daily reflection was recorded on this historical date. Past dates are preserved as read-only records.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-7">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PenLine className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                {currentReview ? 'Edit Daily Reflection' : 'Daily Evening Reflection'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentReview
                  ? 'Update your accomplishments, learnings, and upcoming objectives.'
                  : 'Capture the highlights of your day and set clear direction for tomorrow.'}
              </p>
            </div>
          </div>

          <ReviewForm
            key={currentReview ? currentReview.id : `new-${selectedDate}`}
            initialData={currentReview}
            date={selectedDate}
            onSubmit={handleSave}
            onCancel={currentReview ? () => setIsEditing(false) : null}
            submitLabel={currentReview ? 'Save Changes' : 'Save Daily Review'}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {!isHistorical && (
        <DeleteReviewModal
          isOpen={isDeleteModalOpen}
          reviewDate={selectedDate}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  )
}
