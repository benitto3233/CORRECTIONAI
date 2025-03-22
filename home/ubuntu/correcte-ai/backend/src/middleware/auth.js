const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

module.exports = function(req, res, next) {
  // Récupérer le token du header
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

  // Vérifier si le token existe
  if (!token) {
    logger.warn('Tentative d\'accès sans token', { ip: req.ip, path: req.originalUrl });
    return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });
  }

  try {
    // Utiliser SecurityService pour vérifier le token
    const securityService = req.services.security;
    const decoded = securityService.verifyToken(token);

    // Vérifier si l'utilisateur a 2FA activé et authentifié
    if (decoded.user.twoFactorAuth?.enabled && !decoded.twoFactorAuthenticated) {
      logger.warn('Tentative d\'accès sans 2FA complète', { userId: decoded.user.id, path: req.originalUrl });
      return res.status(403).json({ msg: 'Authentification à deux facteurs requise', requiresTwoFactor: true });
    }

    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    
    // Mettre à jour la date de dernière activité de l'utilisateur
    if (req.user && req.user.id) {
      const User = require('../models/User');
      User.findByIdAndUpdate(req.user.id, { lastActive: new Date() }).catch(err => {
        logger.error(`Erreur lors de la mise à jour de lastActive: ${err.message}`, { error: err });
      });
    }

    next();
  } catch (err) {
    logger.warn('Token non valide', { error: err.message, ip: req.ip, path: req.originalUrl });
    res.status(401).json({ msg: 'Token non valide' });
  }
};
