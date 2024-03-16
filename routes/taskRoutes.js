// taskRouter.js
import express from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTaskById,
  getTasksByUser,
} from '../controllers/taskController.js';

import * as authController from './../controllers/authController.js';


const router = express.Router();

router.route('/').post(createTask);

router.route('/:id').get(getTaskById).patch(updateTask).delete(deleteTask);

router.get('/project/:projectId', authController.protect, getTasksByProject);


router.route('/user/:userId').get(getTasksByUser);


export default router;
