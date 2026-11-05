/**
 * Wraps an async route handler or controller to automatically forward errors to Express next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

