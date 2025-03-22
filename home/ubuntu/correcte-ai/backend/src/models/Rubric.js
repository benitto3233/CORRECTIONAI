const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RubricSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  subject: {
    type: String
  },
  grade: {
    type: String
  },
  criteria: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    points: {
      type: Number,
      required: true
    },
    levels: [{
      level: String,  // e.g., "Excellent", "Good", "Average", "Needs Improvement"
      score: Number,  // percentage of total points for this criterion
      description: String  // description of what this level means
    }],
    aiPrompt: {
      type: String,  // Custom prompt to guide AI in evaluating this criterion
    },
    feedbackTemplates: [{
      level: String,  // corresponds to level above
      template: String  // feedback template that can be customized by AI
    }]
  }],
  totalPoints: {
    type: Number,
    default: function() {
      return this.criteria.reduce((total, criterion) => total + criterion.points, 0);
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  isTemplate: {
    type: Boolean,
    default: false
  },
  aiAssistance: {
    enabled: {
      type: Boolean,
      default: true
    },
    contextPrompt: {
      type: String,  // Overall instructions for AI when using this rubric
      default: "Please grade this submission using the provided rubric criteria. Provide detailed feedback for each criterion and suggest areas for improvement."
    },
    preferredModel: {
      type: String
    },
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    }
  },
  usageStats: {
    assignmentsCount: {
      type: Number,
      default: 0
    },
    submissionsGraded: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour les statistiques d'utilisation
RubricSchema.methods.updateUsageStats = function(submissionScore) {
  if (!this.usageStats) {
    this.usageStats = {
      assignmentsCount: 0,
      submissionsGraded: 0,
      averageScore: 0,
      lastUsed: new Date()
    };
  }
  
  this.usageStats.submissionsGraded += 1;
  this.usageStats.lastUsed = new Date();
  
  // Mettre à jour la moyenne des scores
  if (typeof submissionScore === 'number') {
    const currentTotal = this.usageStats.averageScore * (this.usageStats.submissionsGraded - 1);
    this.usageStats.averageScore = (currentTotal + submissionScore) / this.usageStats.submissionsGraded;
  }
  
  return this.save();
};

// Méthode pour créer un clone/brouillon de cette rubrique
RubricSchema.methods.cloneRubric = function(newUserId, options = {}) {
  const { newTitle = `Copie de ${this.title}`, isTemplate = false } = options;
  
  const clonedData = this.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  delete clonedData.usageStats;
  
  clonedData.title = newTitle;
  clonedData.createdBy = newUserId;
  clonedData.isTemplate = isTemplate;
  clonedData.collaborators = [];
  
  return mongoose.model('Rubric').create(clonedData);
};

module.exports = mongoose.model('Rubric', RubricSchema);
