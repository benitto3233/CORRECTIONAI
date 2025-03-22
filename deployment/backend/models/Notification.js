const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'assignment_created',
      'submission_graded',
      'collaboration_invite',
      'system_notification',
      'assignment_reminder',
      'comment_received'
    ],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['assignment', 'submission', 'collaboration', 'user']
    },
    resourceId: {
      type: Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Notification', NotificationSchema);
