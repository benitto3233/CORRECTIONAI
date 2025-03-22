const express = require('express');
const router = express.Router();
const Rubric = require('../models/Rubric');

// @route   POST api/rubrics
// @desc    Créer une nouvelle rubrique
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, criteria, isTemplate } = req.body;
    
    // Créer une nouvelle rubrique
    const newRubric = new Rubric({
      title,
      description,
      criteria,
      isTemplate: isTemplate || false,
      createdBy: req.user.id // Ajouté par le middleware d'authentification
    });
    
    const rubric = await newRubric.save();
    res.json(rubric);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/rubrics
// @desc    Obtenir toutes les rubriques
// @access  Private
router.get('/', async (req, res) => {
  try {
    const rubrics = await Rubric.find({ 
      $or: [
        { createdBy: req.user.id },
        { isTemplate: true }
      ]
    }).sort({ createdAt: -1 });
    res.json(rubrics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/rubrics/:id
// @desc    Obtenir une rubrique par ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const rubric = await Rubric.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ msg: 'Rubrique non trouvée' });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir cette rubrique
    if (!rubric.isTemplate && rubric.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    res.json(rubric);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Rubrique non trouvée' });
    }
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
