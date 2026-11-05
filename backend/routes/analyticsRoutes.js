import { Router } from 'express'
import {
  getOverview,
  getWeekly,
  getMonthly,
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validateQuery } from '../middleware/validateMiddleware.js'
import {
  validateOverviewQuery,
  validateWeeklyQuery,
  validateMonthlyQuery,
} from '../validators/analyticsValidator.js'

const router = Router()

// All analytics endpoints require authentication
router.use(protect)

router.get('/overview', validateQuery(validateOverviewQuery), getOverview)
router.get('/weekly', validateQuery(validateWeeklyQuery), getWeekly)
router.get('/monthly', validateQuery(validateMonthlyQuery), getMonthly)

export default router

