import Project from '../models/projectModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Create a new project
export const createProject = catchAsync(async (req, res, next) => {
  const project = await Project.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Get all projects
export const getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find();
  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
    },
  });
});

// Get project by ID
export const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Get all projects associated with a specific user
export const getProjectsByUser = catchAsync(async (req, res, next) => {
  // Find all projects where the owner field matches the user's ID
  const projects = await Project.find({ owner: req.params.userId });

  // Send the response with the projects found
  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
    },
  });
});

// Update project by ID
export const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Delete project by ID
export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});


// Add a task to an existing project
export const addTaskToProject = catchAsync(async (req, res, next) => {
  // Find the project by its ID
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Extract task details from the request body
  const { taskName, taskDescription, taskPomodoro} = req.body;

  // Create a new task object
  const newTask = {
    name: taskName,
    description: taskDescription,
    pomodoro: taskPomodoro,
    completed: false 
  };

  // Add the new task to the project's tasks array
  project.tasks.push(newTask);

  // Save the updated project
  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      project // return the updated project in the response
    }
  });
});

// Delete task from project
export const deleteTaskFromProject = async (req, res, next) => {
  try {
    // Extract projectId and taskId from request params
    const { projectId, taskId } = req.params;
    
    // Find the project by its ID and pull the task from the tasks array
    const project = await Project.findByIdAndUpdate(projectId, {
      $pull: { tasks: taskId }
    }, {
      new: true,
      runValidators: true
    });

    // Check if the project exists
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update task in project
export const updateTaskInProject = async (req, res, next) => {
  try {
    // Extract projectId and taskId from request params
    const { projectId, taskId } = req.params;
    
    // Find the project by its ID and update the task with the given ID
    const project = await Project.findOneAndUpdate(
      { _id: projectId, 'tasks._id': taskId },
      { $set: { 'tasks.$': req.body } },
      { new: true, runValidators: true }
    );

    // Check if the project exists or if the task was updated
    if (!project) {
      return next(new AppError('Project or Task not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};