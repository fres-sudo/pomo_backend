// taskRouter.js
import express from 'express';
import {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTaskById,
} from '../controllers/taskController.js';

const router = express.Router();

router.route('/').get(getAllTasks).post(createTask);

router.route('/:id').get(getTaskById).patch(updateTask).delete(deleteTask);

router.route('/project/:projectId').get(getTasksByProject);



export default router;
