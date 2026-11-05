/**
 * 404 Handler for unknown route requests
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404)
  next(error)
}

/**
 * Centralized error handling middleware.
 * Ensures consistent JSON response structure: { success: false, message: ... }
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode)
  let message = err.message || 'Internal Server Error'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    const errors = Object.values(err.errors).map((e) => e.message)
    message = errors.join(', ')
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404
    message = 'Resource not found with the specified ID'
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409
    const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {})
    if (duplicateFields.includes('email')) {
      message = 'An account with this email address already exists.'
    } else if (duplicateFields.includes('googleId')) {
      message = 'This Google account is already linked to another DayTrack user.'
    } else if (duplicateFields.includes('userId') && duplicateFields.includes('date')) {
      message = 'A review has already been submitted for this date.'
    } else {
      message = `Duplicate value entered for ${duplicateFields.join(', ')}.`
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid authentication token.'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Authentication token has expired. Please log in again.'
  }

  const responseBody = {
    success: false,
    message,
  }

  // Only include stack trace in non-production environments
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    responseBody.stack = err.stack
  }

  res.status(statusCode).json(responseBody)
}

