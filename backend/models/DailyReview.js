import mongoose from 'mongoose'

const isValidDateString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [year, month, day] = str.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

const dailyReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Review date is required (YYYY-MM-DD).'],
      validate: {
        validator: isValidDateString,
        message: 'Review date must be a valid calendar date in YYYY-MM-DD format.',
      },
    },
    accomplishments: {
      type: String,
      trim: true,
      default: '',
      maxlength: [4000, 'Accomplishments cannot exceed 4000 characters.'],
    },
    improvements: {
      type: String,
      trim: true,
      default: '',
      maxlength: [4000, 'Improvements cannot exceed 4000 characters.'],
    },
    tomorrowFocus: {
      type: String,
      trim: true,
      default: '',
      maxlength: [4000, 'Tomorrow focus cannot exceed 4000 characters.'],
    },
    mood: {
      type: String,
      required: [true, 'Please select a mood rating.'],
      enum: {
        values: ['Excellent', 'Good', 'Okay', 'Bad', 'Terrible'],
        message: 'Mood must be Excellent, Good, Okay, Bad, or Terrible.',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

// Compound unique index ensuring one review per user per date
dailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true })

export const DailyReview = mongoose.model('DailyReview', dailyReviewSchema)

