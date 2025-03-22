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
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  file: {
    originalName: String,
    fileName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  extractedText: {
    type: String
  },
  textConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  processingMetadata: {
    ocrStartTime: Date,
    ocrEndTime: Date,
    ocrDuration: Number, // in milliseconds
    ocrModel: String,
    gradingStartTime: Date,
    gradingEndTime: Date,
    gradingDuration: Number, // in milliseconds
    retryCount: { type: Number, default: 0 },
    errorLogs: [{
      stage: String,
      message: String,
      timestamp: Date
    }]
  },
  analysis: {
    handwritingQuality: {
      type: Number,
      min: 1,
      max: 10
    },
    languageQuality: {
      type: Number,
      min: 1,
      max: 10
    },
    contentRelevance: {
      type: Number,
      min: 1,
      max: 10
    },
    criticalThinking: {
      type: Number,
      min: 1,
      max: 10
    },
    conceptUnderstanding: {
      type: Number,
      min: 1,
      max: 10
    },
    strengths: [String],
    areasForImprovement: [String],
    keywords: [String]
  },
  grade: {
    score: {
      type: Number
    },
    feedback: {
      type: String
    },
    rubricScores: [{
      criteriaId: String,
      score: Number,
      feedback: String
    }],
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date
    },
    aiModel: {
      type: String
    },
    teacherModified: {
      type: Boolean,
      default: false
    },
    teacherModifiedAt: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'ocr_complete', 'grading', 'graded', 'reviewed', 'error'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour le statut et ajouter des logs d'erreur
SubmissionSchema.methods.logError = function(stage, message) {
  const errorLog = {
    stage,
    message,
    timestamp: new Date()
  };

  if (!this.processingMetadata) {
    this.processingMetadata = {};
  }
  
  if (!this.processingMetadata.errorLogs) {
    this.processingMetadata.errorLogs = [];
  }

  this.processingMetadata.errorLogs.push(errorLog);
  this.status = 'error';
  
  return this.save();
};

// Méthode pour calculer le temps de traitement total
SubmissionSchema.methods.getTotalProcessingTime = function() {
  let total = 0;
  
  if (this.processingMetadata) {
    if (this.processingMetadata.ocrDuration) {
      total += this.processingMetadata.ocrDuration;
    }
    
    if (this.processingMetadata.gradingDuration) {
      total += this.processingMetadata.gradingDuration;
    }
  }
  
  return total;
};

// Méthode virtuelle pour obtenir la note sur 100
SubmissionSchema.virtual('percentageGrade').get(function() {
  if (!this.grade || typeof this.grade.score !== 'number' || !this.assignment) {
    return null;
  }
  
  // Récupération dynamique des points totaux de l'assignment
  // Si l'assignment est disponible comme un objet complet
  if (typeof this.assignment === 'object' && this.assignment.totalPoints) {
    return (this.grade.score / this.assignment.totalPoints) * 100;
  }
  
  // Sinon retourner null
  return null;
});

module.exports = mongoose.model('Submission', SubmissionSchema);
