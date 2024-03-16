// projectRouter.js
import express from 'express';
import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  addTaskToProject,
  deleteTaskFromProject,
  updateTaskInProject,
  getProjectsByUser
} from '../controllers/projectController.js';
import * as authController from './../controllers/authController.js';

const router = express.Router();

// Define route for adding-deleting-updating a task to a project
router.post('/:projectId/tasks', authController.protect, addTaskToProject);
router.delete('/:projectId/tasks/:taskId',authController.protect, deleteTaskFromProject);
router.patch('/:projectId/tasks/:taskId', authController.protect, updateTaskInProject);


// Define existing routes
router.route('/').get(authController.protect, getAllProjects).post(authController.protect, createProject);
router.route('/:id').get(getProject).patch(authController.protect , updateProject).delete(authController.protect, deleteProject);

// Route to get projects associated with a specific user
router.get('/user/:userId', authController.protect, getProjectsByUser);

export default router;
