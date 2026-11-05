import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address.'],
      index: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId
        },
        'Please provide a password.',
      ],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: {
        values: ['local', 'google'],
        message: 'Auth provider must be either local or google.',
      },
      default: 'local',
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    preferences: {
      theme: {
        type: String,
        enum: {
          values: ['light', 'dark'],
          message: 'Theme must be either light or dark.',
        },
        default: 'light',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.password
        delete ret.__v
        return ret
      },
    },
  }
)

/**
 * Pre-save middleware to securely hash password if modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

/**
 * Method to compare candidate password with stored bcrypt hash.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false
  }
  return bcrypt.compare(enteredPassword, this.password)
}

export const User = mongoose.model('User', userSchema)

