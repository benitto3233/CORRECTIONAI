const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, school, subject, gradeLevel } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hash the password
    const hashedPassword = req.services.security.hashPassword(password);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'teacher',
      school,
      subject,
      gradeLevel,
      status: 'active'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = req.services.security.generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Log analytics
    await req.services.analytics.trackEvent(user._id, 'user_registered', { email });
    
    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Votre compte est bloqué. Veuillez contacter l\'administrateur.' });
    }
    
    // Check if password matches
    const isMatch = req.services.security.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = req.services.security.generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Log analytics
    await req.services.analytics.trackEvent(user._id, 'user_login', { timestamp: new Date() });
    
    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    
    res.json({
      message: 'Connexion réussie',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Check if token is valid (used for auto-login)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }
    
    const decoded = req.services.security.verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ valid: false, message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      valid: true,
      user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, message: 'Token invalide' });
  }
});

// Create admin user (for deployment only - should be removed or protected in production)
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(400).json({ message: 'Un administrateur existe déjà' });
    }
    
    // Create admin user
    const admin = new User({
      name: 'Admin Correcte-AI',
      email: 'admin@correcte-ai.com',
      password: req.services.security.hashPassword('AdminPassword123!'),
      role: 'admin',
      status: 'active'
    });
    
    await admin.save();
    
    res.status(201).json({
      message: 'Administrateur créé avec succès',
      credentials: {
        email: 'admin@correcte-ai.com',
        password: 'AdminPassword123!'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'administrateur' });
  }
});

module.exports = router;
