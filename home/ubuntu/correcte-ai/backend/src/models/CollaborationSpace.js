const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schu00e9ma pour un espace de collaboration entre enseignants
 * Permet le partage de ressources pu00e9dagogiques et la collaboration
 */
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
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedResources: [{
    resourceType: {
      type: String,
      enum: ['rubric', 'assignment', 'document', 'template'],
      required: true
    },
    resource: {
      type: Schema.Types.ObjectId,
      refPath: 'sharedResources.resourceType',
      required: true
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['private', 'public', 'organization'],
    default: 'private'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  settings: {
    allowResourceDuplication: {
      type: Boolean,
      default: true
    },
    allowInvitations: {
      type: Boolean,
      default: true
    },
    notifyOnNewContent: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index pour amu00e9liorer les performances des requu00eates
CollaborationSpaceSchema.index({ creator: 1 });
CollaborationSpaceSchema.index({ 'members.user': 1 });
CollaborationSpaceSchema.index({ isActive: 1 });
CollaborationSpaceSchema.index({ tags: 1 });

/**
 * Vu00e9rifie si un utilisateur est membre de cet espace
 * @param {string} userId - ID de l'utilisateur
 * @returns {boolean} Vrai si l'utilisateur est membre
 */
CollaborationSpaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

/**
 * Vu00e9rifie si un utilisateur est admin de cet espace
 * @param {string} userId - ID de l'utilisateur
 * @returns {boolean} Vrai si l'utilisateur est admin
 */
CollaborationSpaceSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

/**
 * Ru00e9cupu00e8re le ru00f4le d'un utilisateur dans cet espace
 * @param {string} userId - ID de l'utilisateur
 * @returns {string|null} Ru00f4le de l'utilisateur ou null s'il n'est pas membre
 */
CollaborationSpaceSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

/**
 * Vu00e9rifie si un utilisateur peut modifier une ressource partagu00e9e
 * @param {string} userId - ID de l'utilisateur
 * @param {string} resourceId - ID de la ressource
 * @returns {boolean} Vrai si l'utilisateur peut modifier la ressource
 */
CollaborationSpaceSchema.methods.canModifyResource = function(userId, resourceId) {
  const userRole = this.getUserRole(userId);
  
  // Les admins peuvent tout modifier
  if (userRole === 'admin') return true;
  
  // Les contributeurs peuvent modifier leurs propres ressources
  if (userRole === 'contributor') {
    const resource = this.sharedResources.find(r => r.resource.toString() === resourceId.toString());
    return resource && resource.sharedBy.toString() === userId.toString();
  }
  
  // Les spectateurs ne peuvent rien modifier
  return false;
};

module.exports = mongoose.model('CollaborationSpace', CollaborationSpaceSchema);
