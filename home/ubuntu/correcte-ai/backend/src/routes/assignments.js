const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Rubric = require('../models/Rubric');

// @route   POST api/assignments
// @desc    Créer un nouveau devoir
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, class: className, subject, totalPoints, dueDate, rubricId } = req.body;
    
    // Créer un nouveau devoir
    const newAssignment = new Assignment({
      title,
      description,
      class: className,
      subject,
      totalPoints,
      dueDate,
      rubric: rubricId,
      createdBy: req.user.id // Ajouté par le middleware d'authentification
    });
    
    const assignment = await newAssignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/assignments
// @desc    Obtenir tous les devoirs
// @access  Private
router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user.id })
      .populate('rubric', ['title'])
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/assignments/:id
// @desc    Obtenir un devoir par ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('rubric');
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/assignments/:id
// @desc    Mettre à jour un devoir
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, description, class: className, subject, totalPoints, dueDate, rubricId, status } = req.body;
    
    // Trouver le devoir
    let assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à modifier ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    // Mettre à jour les champs
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (className) assignment.class = className;
    if (subject) assignment.subject = subject;
    if (totalPoints) assignment.totalPoints = totalPoints;
    if (dueDate) assignment.dueDate = dueDate;
    if (rubricId) assignment.rubric = rubricId;
    if (status) assignment.status = status;
    
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/assignments/:id
// @desc    Supprimer un devoir
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Trouver le devoir
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à supprimer ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    await assignment.remove();
    res.json({ msg: 'Devoir supprimé' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
