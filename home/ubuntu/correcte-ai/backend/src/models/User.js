const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  profilePicture: {
    type: String,
    default: '/avatars/default.png'
  },
  school: {
    type: String
  },
  grade: {
    type: String
  },
  subjects: [{
    type: String
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: { type: Boolean, default: true },
      app: { type: Boolean, default: true }
    },
    language: {
      type: String,
      default: 'french'
    }
  },
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: { type: String },
    backupCodes: [{ type: String }]
  },
  lastActive: {
    type: Date
  },
  stats: {
    assignmentsGraded: { type: Number, default: 0 },
    timeSaved: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode virtuelle pour obtenir le nom complet de l'utilisateur
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Méthode pour mettre à jour les statistiques d'utilisation
UserSchema.methods.updateStats = function(stats) {
  if (stats.assignmentsGraded) this.stats.assignmentsGraded += stats.assignmentsGraded;
  if (stats.timeSaved) this.stats.timeSaved += stats.timeSaved;
  if (stats.accuracy) {
    // Calculer la moyenne pondérée pour l'exactitude
    const totalAssignments = this.stats.assignmentsGraded;
    const newTotal = totalAssignments + (stats.assignmentsGraded || 1);
    this.stats.accuracy = ((this.stats.accuracy * totalAssignments) + 
                         (stats.accuracy * (stats.assignmentsGraded || 1))) / newTotal;
  }
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);
