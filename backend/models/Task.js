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

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    date: {
      type: String,
      required: [true, 'Task date is required (YYYY-MM-DD).'],
      validate: {
        validator: isValidDateString,
        message: 'Task date must be a valid calendar date in YYYY-MM-DD format.',
      },
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high.',
      },
      default: 'medium',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [50, 'Category cannot exceed 50 characters.'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    time: {
      type: String,
      trim: true,
      default: null,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Time must be in 24-hour HH:mm format, or null.',
      ],
      validate: {
        validator: function (v) {
          return v === null || v === undefined || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v)
        },
        message: 'Time must be in 24-hour HH:mm format, or null.',
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

// Compound index for querying tasks by user and date efficiently
taskSchema.index({ userId: 1, date: 1 })

export const Task = mongoose.model('Task', taskSchema)

