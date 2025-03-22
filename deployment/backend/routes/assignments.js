const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assignment = mongoose.model('Assignment');

// Get all assignments for current user
router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find({ creator: req.user.id })
      .populate('rubric', 'name')
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
  }
});

// Create a new assignment
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, gradeLevel, rubric, dueDate } = req.body;
    
    const newAssignment = new Assignment({
      title,
      description,
      subject,
      gradeLevel,
      creator: req.user.id,
      rubric,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'active'
    });
    
    await newAssignment.save();
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'assignment_created',
      { assignmentId: newAssignment._id }
    );
    
    res.status(201).json({
      message: 'Devoir créé avec succès',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du devoir' });
  }
});

// Get a specific assignment
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('rubric')
      .populate('creator', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // Check if user is allowed to access this assignment
    if (assignment.creator._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du devoir' });
  }
});

// Update an assignment
router.put('/:id', async (req, res) => {
  try {
    const { title, description, subject, gradeLevel, rubric, dueDate, status } = req.body;
    
    // Find assignment
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // Check if user is the creator
    if (assignment.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (subject) assignment.subject = subject;
    if (gradeLevel) assignment.gradeLevel = gradeLevel;
    if (rubric) assignment.rubric = rubric;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (status) assignment.status = status;
    
    assignment.updatedAt = new Date();
    await assignment.save();
    
    res.json({
      message: 'Devoir mis à jour avec succès',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du devoir' });
  }
});

// Delete an assignment
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // Check if user is the creator
    if (assignment.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    
    // Clean up submissions associated with this assignment
    const Submission = mongoose.model('Submission');
    await Submission.deleteMany({ assignment: req.params.id });
    
    res.json({ message: 'Devoir supprimé avec succès' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du devoir' });
  }
});

// Get submissions for an assignment
router.get('/:id/submissions', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // Check if user is the creator
    if (assignment.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const Submission = mongoose.model('Submission');
    const submissions = await Submission.find({ assignment: req.params.id })
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des soumissions' });
  }
});

module.exports = router;
