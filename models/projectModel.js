import mongoose from 'mongoose';

const { Schema } = mongoose;

const projectSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the project'],
  },
  description: {
    type: String,
  },
  tasks: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Task',
      //unique: true,
    }],
    default: [],
  },
  imageCover: String,
  dueDate: {
    type: Date,
    default: Date.now(),
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A project must have an owner'],
  },
  contributors: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      //unique: true,
    }],
    default: [],
  },
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
