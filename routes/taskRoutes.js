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

router.route('/').post(authController.protect, createTask);

router.route('/:id')
  .get(authController.protect, getTaskById)
  .patch(authController.protect, updateTask)
  .delete(authController.protect, deleteTask);

router.get('/project/:projectId', authController.protect, getTasksByProject);


router.route('/user/:userId').get(authController.protect, getTasksByUser);


export default router;
