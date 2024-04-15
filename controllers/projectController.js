import Project from '../models/projectModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {put} from '@vercel/blob';
import aws from "aws-sdk";

// Configure AWS S3
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const s3 = new aws.S3();

// Create a new project
export const createProject = catchAsync(async (req, res, next) => {
  const { name, description, dueDate, owner, imageCover, tasks, contributors } = req.body;

  const projectData = {
    name,
    description,
    dueDate,
    owner,
    imageCover,
    tasks: tasks || [], // Ensure tasks field is initialized
    contributors: contributors || [], // Ensure contributors field is initialized
  };

  const project = await Project.create(projectData);
  res.status(201).json(project);
});

export const uploadImageCover = async (req, res) => {
  try {
    const file = req.file;

    // Upload the file to S3
    const result = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `user-${req.user.id}-${Date.now()}.jpeg`,
      Body: file.buffer,
      ACL:'public-read'
    }).promise();

    console.log({result});

    const uploadedImageUrl = result.Location;

    // Update the project's photo field in MongoDB
    const updateProject = await Project.findByIdAndUpdate(req.params.id, { imageCover: uploadedImageUrl }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updateProject);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while uploading the file.', message : err });
  }
};


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
  res.status(200).json(projects,);
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
  res.status(200).json(project);
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