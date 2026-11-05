import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  googleAuth,
  getMe,
  logout,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
} from '../validators/authValidator.js'

const router = Router()

// Rate limiter for authentication endpoints: max 50 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
})

router.post('/register', authLimiter, validate(validateRegister), register)
router.post('/login', authLimiter, validate(validateLogin), login)
router.post('/google', authLimiter, validate(validateGoogleAuth), googleAuth)
router.get('/me', protect, getMe)
router.post('/logout', logout)

export default router

