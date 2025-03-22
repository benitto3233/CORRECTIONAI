const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authorize } = require('../middleware/auth');
const CollaborationService = require('../services/CollaborationService');
const NotificationService = require('../services/NotificationService');
const CacheService = require('../services/CacheService');

// Import models
const User = mongoose.model('User');
const CollaborationSpace = mongoose.model('CollaborationSpace');

// Initialize services
const notificationService = new NotificationService();
const cacheService = new CacheService();
const collaborationService = new CollaborationService({
  notificationService,
  cacheService,
  userModel: User
});

/**
 * @route   GET /api/collaboration/spaces
 * @desc    Get all collaboration spaces for the current user
 * @access  Private
 */
router.get('/spaces', authorize(), async (req, res) => {
  try {
    const spaces = await collaborationService.getUserSpaces(req.user.id);
    res.json(spaces);
  } catch (error) {
    console.error('Error fetching collaboration spaces:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des espaces de collaboration' });
  }
});

/**
 * @route   POST /api/collaboration/spaces
 * @desc    Create a new collaboration space
 * @access  Private
 */
router.post('/spaces', authorize(), async (req, res) => {
  try {
    const { name, description, visibility, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Le nom de l\'espace est requis' });
    }
    
    const spaceData = {
      name,
      description,
      visibility: visibility || 'private',
      tags: tags || []
    };
    
    const space = await collaborationService.createCollaborationSpace(spaceData, req.user.id);
    res.status(201).json(space);
  } catch (error) {
    console.error('Error creating collaboration space:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'espace de collaboration' });
  }
});

/**
 * @route   GET /api/collaboration/spaces/:id
 * @desc    Get a specific collaboration space by ID
 * @access  Private
 */
router.get('/spaces/:id', authorize(), async (req, res) => {
  try {
    const space = await CollaborationSpace.findById(req.params.id)
      .populate('creator', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture')
      .populate('members.addedBy', 'name');
    
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Vérifier que l'utilisateur est membre de l'espace
    if (!space.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Accès non autorisé à cet espace de collaboration' });
    }
    
    res.json(space);
  } catch (error) {
    console.error('Error fetching collaboration space:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'espace de collaboration' });
  }
});

/**
 * @route   PUT /api/collaboration/spaces/:id
 * @desc    Update a collaboration space
 * @access  Private (Admin only)
 */
router.put('/spaces/:id', authorize(), async (req, res) => {
  try {
    let space = await CollaborationSpace.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Vérifier que l'utilisateur est admin de l'espace
    if (!space.isAdmin(req.user.id)) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier cet espace' });
    }
    
    const { name, description, visibility, tags, settings } = req.body;
    
    // Mettre à jour les champs
    if (name) space.name = name;
    if (description !== undefined) space.description = description;
    if (visibility) space.visibility = visibility;
    if (tags) space.tags = tags;
    if (settings) space.settings = { ...space.settings, ...settings };
    
    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Error updating collaboration space:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'espace de collaboration' });
  }
});

/**
 * @route   DELETE /api/collaboration/spaces/:id
 * @desc    Delete (deactivate) a collaboration space
 * @access  Private (Admin only)
 */
router.delete('/spaces/:id', authorize(), async (req, res) => {
  try {
    const result = await collaborationService.deleteCollaborationSpace(req.params.id, req.user.id);
    res.json({ success: result, message: 'Espace de collaboration supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting collaboration space:', error);
    if (error.message.includes('Permissions insuffisantes') || error.message.includes('non trouvé')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'espace de collaboration' });
  }
});

/**
 * @route   POST /api/collaboration/spaces/:id/members
 * @desc    Add a member to a collaboration space
 * @access  Private (Admin only)
 */
router.post('/spaces/:id/members', authorize(), async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: 'L\'ID utilisateur et le rôle sont requis' });
    }
    
    const space = await collaborationService.addMember(req.params.id, userId, role, req.user.id);
    res.json(space);
  } catch (error) {
    console.error('Error adding member to collaboration space:', error);
    if (error.message.includes('Permissions insuffisantes') || 
        error.message.includes('non trouvé')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de l\'ajout d\'un membre à l\'espace de collaboration' });
  }
});

/**
 * @route   DELETE /api/collaboration/spaces/:id/members/:userId
 * @desc    Remove a member from a collaboration space
 * @access  Private (Admin only)
 */
router.delete('/spaces/:id/members/:userId', authorize(), async (req, res) => {
  try {
    const space = await collaborationService.removeMember(req.params.id, req.params.userId, req.user.id);
    res.json(space);
  } catch (error) {
    console.error('Error removing member from collaboration space:', error);
    if (error.message.includes('Permissions insuffisantes') || 
        error.message.includes('non trouvé') || 
        error.message.includes('dernier administrateur')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors du retrait d\'un membre de l\'espace de collaboration' });
  }
});

/**
 * @route   POST /api/collaboration/spaces/:id/share
 * @desc    Share a resource in a collaboration space
 * @access  Private (Members only)
 */
router.post('/spaces/:id/share', authorize(), async (req, res) => {
  try {
    const { resourceType, resourceId } = req.body;
    
    if (!resourceType || !resourceId) {
      return res.status(400).json({ message: 'Le type et l\'ID de la ressource sont requis' });
    }
    
    const result = await collaborationService.shareResource(
      req.params.id, 
      resourceType, 
      resourceId, 
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error sharing resource in collaboration space:', error);
    if (error.message.includes('non trouvé') || 
        error.message.includes('pas membre') || 
        error.message.includes('pas les droits')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors du partage de la ressource' });
  }
});

/**
 * @route   GET /api/collaboration/spaces/:id/resources
 * @desc    Get shared resources in a collaboration space
 * @access  Private (Members only)
 */
router.get('/spaces/:id/resources', authorize(), async (req, res) => {
  try {
    const { resourceType, limit, page } = req.query;
    
    const options = {
      resourceType,
      limit: limit ? parseInt(limit) : 20,
      page: page ? parseInt(page) : 1
    };
    
    const resources = await collaborationService.getSharedResources(
      req.params.id,
      req.user.id,
      options
    );
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching shared resources:', error);
    if (error.message.includes('non trouvé') || error.message.includes('Accès refusé')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération des ressources partagées' });
  }
});

/**
 * @route   GET /api/collaboration/users/search
 * @desc    Search for users to add to collaboration spaces
 * @access  Private
 */
router.get('/users/search', authorize(), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Le terme de recherche doit contenir au moins 2 caractères' });
    }
    
    // Rechercher les utilisateurs par nom ou email
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email profilePicture school grade subjects')
    .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche d\'utilisateurs' });
  }
});

module.exports = router;
