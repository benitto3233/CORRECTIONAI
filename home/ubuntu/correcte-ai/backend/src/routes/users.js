const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/users/me
// @desc    Mettre à jour les informations de l'utilisateur
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Construire l'objet de mise à jour
    const userFields = {};
    if (name) userFields.name = name;
    if (email) userFields.email = email;
    
    // Mettre à jour l'utilisateur
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/users/settings
// @desc    Mettre à jour les paramètres de l'utilisateur
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { preferredModel, exportFormat, apiKeys } = req.body;
    
    // Construire l'objet de mise à jour
    const settingsFields = {};
    if (preferredModel) settingsFields.preferredModel = preferredModel;
    if (exportFormat) settingsFields.exportFormat = exportFormat;
    if (apiKeys) settingsFields.apiKeys = apiKeys;
    
    // Mettre à jour l'utilisateur
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { settings: settingsFields } },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
