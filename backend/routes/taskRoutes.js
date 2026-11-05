import { Router } from 'express'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import {
  validateCreateTask,
  validateUpdateTask,
} from '../validators/taskValidator.js'

const router = Router()

// All task routes require authentication
router.use(protect)

router.route('/')
  .post(validate(validateCreateTask), createTask)
  .get(getTasks)

router.route('/:id')
  .get(getTaskById)
  .patch(validate(validateUpdateTask), updateTask)
  .delete(deleteTask)

export default router

