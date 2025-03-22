const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RubricSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  gradeLevel: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  criteria: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 1
    },
    weight: {
      type: Number,
      default: 1,
      min: 0
    },
    levels: [{
      name: {
        type: String,
        trim: true
      },
      pointValue: {
        type: Number
      },
      description: {
        type: String,
        trim: true
      }
    }]
  }],
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Rubric', RubricSchema);
