import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

/**
 * Protect routes by verifying JWT from HTTP-only cookie or Authorization header.
 * Attaches authenticated user to req.user.
 */
export const protect = async (req, res, next) => {
  let token

  // 1. Read token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }
  // 2. Fallback to Authorization Bearer header (helpful for automated tests and API tools)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No authentication token provided.',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Retrieve user and ensure user still exists in database
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      })
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid authentication token.',
    })
  }
}

