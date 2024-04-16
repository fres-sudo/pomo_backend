import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the task'],
    unique: false,
  },
  description: {
    type: String,
  },
  pomodoro: {
    type: Number,
    required: [true, 'Set at least 1 pomodoro per task'],
  },
  pomodoroCompleted: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    required: true,
  },
  referenceProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A task must have a user to refer'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  completedAt: {
    type: Date,
  }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
