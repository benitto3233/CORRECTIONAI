const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CollaborationSpace = mongoose.model('CollaborationSpace');

// Get user's collaboration spaces
router.get('/spaces', async (req, res) => {
  try {
    const spaces = await req.services.collaboration.getUserCollaborationSpaces(req.user.id);
    res.json(spaces);
  } catch (error) {
    console.error('Get collaboration spaces error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des espaces de collaboration' });
  }
});

// Create a new collaboration space
router.post('/spaces', async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    
    const newSpace = await req.services.collaboration.createCollaborationSpace(req.user.id, {
      name,
      description,
      visibility: visibility || 'private'
    });
    
    res.status(201).json({
      message: 'Espace de collaboration créé avec succès',
      space: newSpace
    });
  } catch (error) {
    console.error('Create collaboration space error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'espace de collaboration' });
  }
});

// Get a specific collaboration space
router.get('/spaces/:id', async (req, res) => {
  try {
    const space = await CollaborationSpace.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'sharedResources.resource',
        select: 'name title description'
      });
    
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Check if user is a member
    const isMember = space.members.some(m => m.user._id.toString() === req.user.id);
    if (!isMember && space.visibility !== 'public') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    res.json(space);
  } catch (error) {
    console.error('Get collaboration space error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'espace de collaboration' });
  }
});

// Update a collaboration space
router.put('/spaces/:id', async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    
    // Find space
    const space = await CollaborationSpace.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Check if user is admin or creator
    const memberStatus = space.members.find(m => m.user.toString() === req.user.id);
    if (!memberStatus || (memberStatus.role !== 'admin' && space.creator.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Update fields
    if (name) space.name = name;
    if (description) space.description = description;
    if (visibility) space.visibility = visibility;
    
    space.updatedAt = new Date();
    await space.save();
    
    res.json({
      message: 'Espace de collaboration mis à jour avec succès',
      space
    });
  } catch (error) {
    console.error('Update collaboration space error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'espace de collaboration' });
  }
});

// Add a member to a collaboration space
router.post('/spaces/:id/members', async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Check if space exists
    const space = await CollaborationSpace.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Check if user is admin or creator
    const memberStatus = space.members.find(m => m.user.toString() === req.user.id);
    if (!memberStatus || (memberStatus.role !== 'admin' && space.creator.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Add member
    const updatedSpace = await req.services.collaboration.addMember(
      req.params.id, 
      userId, 
      role || 'contributor'
    );
    
    res.json({
      message: 'Membre ajouté avec succès',
      space: updatedSpace
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du membre' });
  }
});

// Remove a member from a collaboration space
router.delete('/spaces/:spaceId/members/:userId', async (req, res) => {
  try {
    // Find space
    const space = await CollaborationSpace.findById(req.params.spaceId);
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Check if user is admin or creator
    const memberStatus = space.members.find(m => m.user.toString() === req.user.id);
    if (!memberStatus || (memberStatus.role !== 'admin' && space.creator.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Don't allow removing the creator
    if (space.creator.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Impossible de supprimer le créateur de l\'espace' });
    }
    
    // Remove member
    space.members = space.members.filter(m => m.user.toString() !== req.params.userId);
    await space.save();
    
    res.json({
      message: 'Membre supprimé avec succès',
      space
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du membre' });
  }
});

// Share a resource in a collaboration space
router.post('/spaces/:id/resources', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.body;
    
    // Find space
    const space = await CollaborationSpace.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ message: 'Espace de collaboration non trouvé' });
    }
    
    // Check if user is a member
    const isMember = space.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Check if resource exists
    let resource;
    if (resourceType === 'rubric') {
      resource = await mongoose.model('Rubric').findById(resourceId);
    } else if (resourceType === 'assignment') {
      resource = await mongoose.model('Assignment').findById(resourceId);
    }
    
    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }
    
    // Check if resource is already shared
    const isAlreadyShared = space.sharedResources.some(
      r => r.resource.toString() === resourceId && r.resourceType === resourceType
    );
    
    if (isAlreadyShared) {
      return res.status(400).json({ message: 'Cette ressource est déjà partagée dans cet espace' });
    }
    
    // Add resource
    space.sharedResources.push({
      resourceType,
      resource: resourceId,
      sharedBy: req.user.id,
      sharedAt: new Date()
    });
    
    await space.save();
    
    // Notify members
    const notifyMembers = space.members
      .filter(m => m.user.toString() !== req.user.id) // Don't notify the sharer
      .map(async (member) => {
        await req.services.notification.createNotification(
          member.user,
          'collaboration_share',
          `Nouvelle ressource partagée dans l'espace ${space.name}`
        );
      });
    
    await Promise.all(notifyMembers);
    
    res.json({
      message: 'Ressource partagée avec succès',
      space
    });
  } catch (error) {
    console.error('Share resource error:', error);
    res.status(500).json({ message: 'Erreur lors du partage de la ressource' });
  }
});

module.exports = router;
