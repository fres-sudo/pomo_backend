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

const router = express.Router();

// Define route for adding-deleting-updating a task to a project
router.post('/:projectId/tasks', addTaskToProject);
router.delete('/:projectId/tasks/:taskId', deleteTaskFromProject);
router.patch('/:projectId/tasks/:taskId', updateTaskInProject);


// Define existing routes
router.route('/').get(getAllProjects).post(createProject);
router.route('/:id').get(getProject).patch(updateProject).delete(deleteProject);

// Route to get projects associated with a specific user
router.route('/user/:userId').get(getProjectsByUser);

export default router;
