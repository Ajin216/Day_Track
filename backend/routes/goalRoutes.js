import { Router } from 'express'
import {
  createGoal,
  getActiveGoal,
  getGoals,
  getGoalById,
  updateGoal,
  completeGoal,
  deleteGoal,
  getAchievements,
} from '../controllers/goalController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate, validateQuery } from '../middleware/validateMiddleware.js'
import {
  validateCreateGoal,
  validateUpdateGoal,
  validateGoalQuery,
  validateAchievementsQuery,
} from '../validators/goalValidator.js'

const router = Router()

// All goal endpoints require authentication
router.use(protect)

router
  .route('/')
  .post(validate(validateCreateGoal), createGoal)
  .get(validateQuery(validateGoalQuery), getGoals)

router.get('/active', validateQuery(validateGoalQuery), getActiveGoal)
router.get('/achievements', validateQuery(validateAchievementsQuery), getAchievements)

router
  .route('/:id')
  .get(getGoalById)
  .patch(validate(validateUpdateGoal), updateGoal)
  .delete(deleteGoal)

router.patch('/:id/complete', completeGoal)

export default router

