import mongoose from 'mongoose'

const isValidMonthString = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) return false
  const [year, month] = str.split('-').map(Number)
  return year >= 1970 && year <= 2100 && month >= 1 && month <= 12
}

const monthlyGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Monthly goal must belong to a user.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },
    target: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Target milestone cannot exceed 500 characters.'],
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress percentage cannot be less than 0.'],
      max: [100, 'Progress percentage cannot exceed 100.'],
    },
    month: {
      type: String,
      required: [true, 'Target month is required (YYYY-MM).'],
      validate: {
        validator: isValidMonthString,
        message: 'Month must be in YYYY-MM format between 1970 and 2100.',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'completed'],
        message: 'Status must be in_progress or completed.',
      },
      default: 'in_progress',
    },
    completedAt: {
      type: Date,
      default: null,
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

// Efficient query index for retrieving goals by user and month
monthlyGoalSchema.index({ userId: 1, month: 1 })

// Efficient query index for completed achievements sorted by completion date
monthlyGoalSchema.index({ userId: 1, status: 1, completedAt: -1 })

// Enforce at most ONE active ('in_progress') goal per user per month
monthlyGoalSchema.index(
  { userId: 1, month: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
  }
)

export const MonthlyGoal = mongoose.model('MonthlyGoal', monthlyGoalSchema)

