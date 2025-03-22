const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  class: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date
  },
  rubric: {
    type: Schema.Types.ObjectId,
    ref: 'Rubric'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'graded', 'archived'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
