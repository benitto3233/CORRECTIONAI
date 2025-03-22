const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name, school, subject, gradeLevel, preferences } = req.body;
    
    // Find user and update
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (school) user.school = school;
    if (subject) user.subject = subject;
    if (gradeLevel) user.gradeLevel = gradeLevel;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }
    
    await user.save();
    
    // Return updated user (excluding password)
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Verify current password
    const isMatch = req.services.security.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Update password
    user.password = req.services.security.hashPassword(newPassword);
    await user.save();
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/admin/list', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Create a new user (admin only)
router.post('/admin/create', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const { name, email, password, role, school, subject, gradeLevel, status } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password: req.services.security.hashPassword(password),
      role: role || 'teacher',
      school,
      subject,
      gradeLevel,
      status: status || 'active'
    });
    
    await user.save();
    
    // Return created user (excluding password)
    const userData = user.toObject();
    delete userData.password;
    
    // Send welcome email
    await req.services.email.sendEmail(
      email,
      'Bienvenue sur Correcte-AI',
      `Bonjour ${name},\n\nVotre compte a été créé sur la plateforme Correcte-AI.\n\nVoici vos identifiants de connexion:\nEmail: ${email}\nMot de passe: ${password}\n\nVeuillez changer votre mot de passe lors de votre première connexion.\n\nCordialement,\nL'équipe Correcte-AI`
    );
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// Update user (admin only)
router.put('/admin/update/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const { name, email, role, school, subject, gradeLevel, status } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (school) user.school = school;
    if (subject) user.subject = subject;
    if (gradeLevel) user.gradeLevel = gradeLevel;
    if (status) user.status = status;
    
    await user.save();
    
    // Return updated user (excluding password)
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// Delete user (admin only)
router.delete('/admin/delete/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Find and delete user
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

module.exports = router;
