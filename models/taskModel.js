// taskModel.js

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'Please provide a name for the task'],
  },
  description: {
    type: String,
  },
  pomodoro: {
    type: Number,
    required: [true, 'Set at least 1 pomodoro per task'],
  },
  completed: {
    type: Boolean,
    required: true,
  },
  referenceProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', // Reference the Project model
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A task must have a user to refer'],
  },
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
