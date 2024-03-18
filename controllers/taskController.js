import Task from '../models/taskModel.js';


// Get tasks by project ID
export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ referenceProject: req.params.projectId });
    res.status(200).json(
        tasks,
    );
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    res.status(200).json({
      status: 'success',
      task
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const {name, description, pomodoro, pomodoroCompleted, completed, referenceProject, user, createdAt, completedAt} = req.body;

    const taskData = {
      name,
      description,
      pomodoro,
      pomodoroCompleted,
      completed,
      referenceProject,
      user,
      createdAt,
      completedAt,
    }

    const task = await Task.create(taskData);
    res.status(201).json(
      task
    );
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
};

// Get all tasks by user
export const getTasksByUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming userId is provided in the request params
    const tasks = await Task.find({ user: userId });
    res.status(200).json(tasks,);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};


// Get task by ID
/*
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      task
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: 'Task not found',
    });
  }
};
*/

// Update task by ID
export const updateTask = async (req, res) => {
  try {  
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(
      task
    );
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
};



// Delete task by ID
export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: 'Task not found',
    });
  }
};
