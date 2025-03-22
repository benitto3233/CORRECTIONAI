const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    id: {
      type: String,
      trim: true
    }
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    path: {
      type: String,
      required: true
    },
    processedText: {
      type: String
    },
    ocrConfidence: {
      type: Number
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'graded', 'error', 'review_needed'],
    default: 'pending'
  },
  grade: {
    score: {
      type: Number
    },
    maxScore: {
      type: Number
    },
    feedback: {
      type: String
    },
    criteriaScores: [{
      criteriaId: {
        type: Schema.Types.ObjectId,
        ref: 'Rubric.criteria'
      },
      score: {
        type: Number
      },
      feedback: {
        type: String
      }
    }],
    gradedBy: {
      type: String,
      enum: ['ai', 'teacher', 'both'],
      default: 'ai'
    },
    gradedAt: {
      type: Date
    },
    aiGrade: {
      score: {
        type: Number
      },
      feedback: {
        type: String
      }
    },
    teacherGrade: {
      score: {
        type: Number
      },
      feedback: {
        type: String
      }
    }
  },
  analytics: {
    processingTime: {
      type: Number
    },
    reviewTime: {
      type: Number
    },
    aiAccuracy: {
      type: Number
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Submission', SubmissionSchema);
