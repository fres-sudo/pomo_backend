// taskRouter.js
import express from 'express';
import {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTaskById,
} from '../controllers/taskController.js';

const router = express.Router();

router.route('/').get(getAllTasks).post(createTask);

router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

router.route('/project/:projectId').get(getTasksByProject);

router.route('/task/:id').get(getTaskById);

export default router;
