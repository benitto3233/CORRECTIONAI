const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CollaborationSpaceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'contributor', 'viewer'],
      default: 'contributor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedResources: [{
    resourceType: {
      type: String,
      enum: ['rubric', 'assignment'],
      required: true
    },
    resource: {
      type: Schema.Types.ObjectId,
      refPath: 'sharedResources.resourceType',
      required: true
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['private', 'public', 'school'],
    default: 'private'
  },
  isActive: {
    type: Boolean,
    default: true
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

mongoose.model('CollaborationSpace', CollaborationSpaceSchema);
