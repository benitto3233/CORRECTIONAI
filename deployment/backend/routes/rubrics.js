const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Rubric = mongoose.model('Rubric');

// Get all rubrics for current user
router.get('/', async (req, res) => {
  try {
    const rubrics = await Rubric.find({ creator: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(rubrics);
  } catch (error) {
    console.error('Get rubrics error:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des grilles d\'\u00e9valuation' });
  }
});

// Create a new rubric
router.post('/', async (req, res) => {
  try {
    const { name, description, subject, gradeLevel, criteria, visibility } = req.body;
    
    const newRubric = new Rubric({
      name,
      description,
      subject,
      gradeLevel,
      creator: req.user.id,
      criteria: criteria || [],
      visibility: visibility || 'private'
    });
    
    await newRubric.save();
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'rubric_created',
      { rubricId: newRubric._id }
    );
    
    res.status(201).json({
      message: 'Grille d\'\u00e9valuation cru00e9u00e9e avec succu00e8s',
      rubric: newRubric
    });
  } catch (error) {
    console.error('Create rubric error:', error);
    res.status(500).json({ message: 'Erreur lors de la cru00e9ation de la grille d\'\u00e9valuation' });
  }
});

// Get a specific rubric
router.get('/:id', async (req, res) => {
  try {
    const rubric = await Rubric.findById(req.params.id)
      .populate('creator', 'name email');
    
    if (!rubric) {
      return res.status(404).json({ message: 'Grille d\'\u00e9valuation non trouvu00e9e' });
    }
    
    // Check if user has access to this rubric
    if (rubric.creator._id.toString() !== req.user.id && 
        rubric.visibility === 'private' && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accu00e8s non autorisu00e9' });
    }
    
    res.json(rubric);
  } catch (error) {
    console.error('Get rubric error:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration de la grille d\'\u00e9valuation' });
  }
});

// Update a rubric
router.put('/:id', async (req, res) => {
  try {
    const { name, description, subject, gradeLevel, criteria, visibility } = req.body;
    
    // Find rubric
    const rubric = await Rubric.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ message: 'Grille d\'\u00e9valuation non trouvu00e9e' });
    }
    
    // Check if user is the creator
    if (rubric.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accu00e8s non autorisu00e9' });
    }
    
    // Update fields
    if (name) rubric.name = name;
    if (description) rubric.description = description;
    if (subject) rubric.subject = subject;
    if (gradeLevel) rubric.gradeLevel = gradeLevel;
    if (criteria) rubric.criteria = criteria;
    if (visibility) rubric.visibility = visibility;
    
    rubric.updatedAt = new Date();
    await rubric.save();
    
    res.json({
      message: 'Grille d\'\u00e9valuation mise u00e0 jour avec succu00e8s',
      rubric
    });
  } catch (error) {
    console.error('Update rubric error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise u00e0 jour de la grille d\'\u00e9valuation' });
  }
});

// Delete a rubric
router.delete('/:id', async (req, res) => {
  try {
    const rubric = await Rubric.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ message: 'Grille d\'\u00e9valuation non trouvu00e9e' });
    }
    
    // Check if user is the creator
    if (rubric.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accu00e8s non autorisu00e9' });
    }
    
    // Check if rubric is being used by any assignments
    const Assignment = mongoose.model('Assignment');
    const assignmentsUsingRubric = await Assignment.countDocuments({ rubric: req.params.id });
    
    if (assignmentsUsingRubric > 0) {
      return res.status(400).json({ 
        message: 'Cette grille d\'\u00e9valuation est utilisu00e9e par des devoirs existants et ne peut pas u00eatre supprimu00e9e'
      });
    }
    
    await Rubric.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Grille d\'\u00e9valuation supprimu00e9e avec succu00e8s' });
  } catch (error) {
    console.error('Delete rubric error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la grille d\'\u00e9valuation' });
  }
});

// Get public rubrics
router.get('/public/list', async (req, res) => {
  try {
    const publicRubrics = await Rubric.find({ visibility: 'public' })
      .populate('creator', 'name')
      .sort({ createdAt: -1 });
    
    res.json(publicRubrics);
  } catch (error) {
    console.error('Get public rubrics error:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des grilles d\'\u00e9valuation publiques' });
  }
});

// Duplicate a rubric
router.post('/:id/duplicate', async (req, res) => {
  try {
    const rubric = await Rubric.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ message: 'Grille d\'\u00e9valuation non trouvu00e9e' });
    }
    
    // Check if user has access to this rubric for duplication
    if (rubric.creator.toString() !== req.user.id && 
        rubric.visibility === 'private' && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accu00e8s non autorisu00e9' });
    }
    
    // Create new rubric based on the existing one
    const duplicatedRubric = new Rubric({
      name: `${rubric.name} (Copie)`,
      description: rubric.description,
      subject: rubric.subject,
      gradeLevel: rubric.gradeLevel,
      creator: req.user.id,
      criteria: rubric.criteria,
      visibility: 'private' // Always set duplicated rubrics to private initially
    });
    
    await duplicatedRubric.save();
    
    res.status(201).json({
      message: 'Grille d\'\u00e9valuation dupliquu00e9e avec succu00e8s',
      rubric: duplicatedRubric
    });
  } catch (error) {
    console.error('Duplicate rubric error:', error);
    res.status(500).json({ message: 'Erreur lors de la duplication de la grille d\'\u00e9valuation' });
  }
});

module.exports = router;
