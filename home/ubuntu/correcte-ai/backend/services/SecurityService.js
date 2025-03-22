const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');

/**
 * Service de su00e9curitu00e9 avancu00e9e
 * Gu00e8re l'authentification, le chiffrement et la conformitu00e9
 */
class SecurityService {
  constructor(config = {}) {
    const {
      jwtSecret = process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h',
      bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
      encryptionKey = process.env.ENCRYPTION_KEY,
      encryptionIv = process.env.ENCRYPTION_IV,
      userSuspiciousLoginThreshold = 3,
    } = config;

    if (!encryptionKey) {
      console.warn('WARNING: No encryption key provided. Generating a temporary one. This is not secure for production.');
      this.encryptionKey = crypto.randomBytes(32).toString('hex');
    } else {
      this.encryptionKey = encryptionKey;
    }

    if (!encryptionIv) {
      console.warn('WARNING: No encryption IV provided. Generating a temporary one. This is not secure for production.');
      this.encryptionIv = crypto.randomBytes(16).toString('hex').slice(0, 16);
    } else {
      this.encryptionIv = encryptionIv;
    }

    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.bcryptSaltRounds = bcryptSaltRounds;
    this.userSuspiciousLoginThreshold = userSuspiciousLoginThreshold;
    
    // Stockage temporaire pour les sessions et les tentatives de connexion
    // A remplacer par une base de donnu00e9es en production
    this.loginAttempts = new Map();
    this.sessions = new Map();
    this.suspiciousActivities = [];
  }

  /**
   * Chiffre des donnu00e9es sensibles
   * @param {string} text - Texte u00e0 chiffrer
   * @returns {string} Texte chiffru00e9 (format hexadu00e9cimal)
   */
  encryptData(text) {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = Buffer.from(this.encryptionIv, 'hex');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Du00e9chiffre des donnu00e9es sensibles
   * @param {string} encryptedText - Texte chiffru00e9 (format hexadu00e9cimal)
   * @returns {string} Texte du00e9chiffru00e9
   */
  decryptData(encryptedText) {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = Buffer.from(this.encryptionIv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Chiffre un objet entier pour stockage su00e9curisu00e9
   * @param {Object} data - Objet u00e0 chiffrer
   * @returns {string} Objet chiffru00e9 (format hexadu00e9cimal)
   */
  encryptObject(data) {
    return this.encryptData(JSON.stringify(data));
  }

  /**
   * Du00e9chiffre un objet pru00e9cu00e9demment chiffru00e9
   * @param {string} encryptedData - Objet chiffru00e9 (format hexadu00e9cimal)
   * @returns {Object} Objet du00e9chiffru00e9
   */
  decryptObject(encryptedData) {
    const decrypted = this.decryptData(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Hache un mot de passe de maniu00e8re su00e9curisu00e9e
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<string>} Mot de passe hachu00e9
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.bcryptSaltRounds);
  }

  /**
   * Vu00e9rifie un mot de passe par rapport u00e0 sa version hachu00e9e
   * @param {string} password - Mot de passe en clair
   * @param {string} hashedPassword - Mot de passe hachu00e9
   * @returns {Promise<boolean>} Validitu00e9 du mot de passe
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Gu00e9nu00e8re un secret pour l'authentification u00e0 deux facteurs
   * @returns {Object} Secret et QR code URL
   */
  generateTwoFactorSecret() {
    const secret = speakeasy.generateSecret({
      name: 'Correcte-AI',
      length: 20
    });
    
    return {
      base32: secret.base32,
      otpauth_url: secret.otpauth_url
    };
  }

  /**
   * Vu00e9rifie un code 2FA
   * @param {string} token - Code fourni par l'utilisateur
   * @param {string} secret - Secret de l'utilisateur (base32)
   * @returns {boolean} Validitu00e9 du code
   */
  verifyTwoFactorToken(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Tolerate +-1 step of time drift
    });
  }

  /**
   * Gu00e9nu00e8re un token JWT
   * @param {Object} payload - Donnu00e9es u00e0 inclure dans le token
   * @returns {string} Token JWT signu00e9
   */
  generateJWT(payload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Vu00e9rifie un token JWT
   * @param {string} token - Token JWT u00e0 vu00e9rifier
   * @returns {Object|null} Payload du token du00e9codu00e9 ou null si invalide
   */
  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return null;
    }
  }

  /**
   * Du00e9tecte une tentative de connexion suspecte
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} connectionInfo - Informations sur la connexion
   * @returns {boolean} Vrai si la connexion est suspecte
   */
  detectSuspiciousLogin(userId, connectionInfo) {
    const { ip, userAgent } = connectionInfo;
    
    // Gu00e9olocalisation de l'IP
    const geo = geoip.lookup(ip);
    
    // Ru00e9cupu00e9rer l'historique des connexions pour cet utilisateur
    if (!this.loginAttempts.has(userId)) {
      this.loginAttempts.set(userId, []);
    }
    
    const userHistory = this.loginAttempts.get(userId);
    
    // Ajouter cette tentative u00e0 l'historique
    const attempt = {
      timestamp: new Date(),
      ip,
      userAgent,
      geo,
      suspicious: false
    };
    
    // Vu00e9rifier si cette tentative est suspecte
    let isSuspicious = false;
    
    // Si l'utilisateur a un historique
    if (userHistory.length > 0) {
      const lastAttempt = userHistory[userHistory.length - 1];
      
      // Connexion depuis un pays diffu00e9rent dans un court intervalle
      if (lastAttempt.geo && geo && lastAttempt.geo.country !== geo.country) {
        const timeDiff = attempt.timestamp - lastAttempt.timestamp;
        // Si moins de 24 heures entre les connexions de pays diffu00e9rents
        if (timeDiff < 24 * 60 * 60 * 1000) {
          isSuspicious = true;
        }
      }
      
      // Plusieurs connexions u00e9chouu00e9es ru00e9centes
      const recentFailedAttempts = userHistory
        .filter(a => a.timestamp > new Date(Date.now() - 30 * 60 * 1000) && a.failed)
        .length;
      
      if (recentFailedAttempts >= this.userSuspiciousLoginThreshold) {
        isSuspicious = true;
      }
    }
    
    attempt.suspicious = isSuspicious;
    userHistory.push(attempt);
    
    // Limiter l'historique u00e0 50 entru00e9es
    if (userHistory.length > 50) {
      userHistory.shift();
    }
    
    // Si suspect, enregistrer l'activitu00e9 pour analyse
    if (isSuspicious) {
      this.suspiciousActivities.push({
        userId,
        timestamp: new Date(),
        ip,
        userAgent,
        geo,
        reason: 'Suspicious login pattern detected'
      });
    }
    
    return isSuspicious;
  }

  /**
   * Gu00e8re une tentative de connexion ru00e9ussie
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} connectionInfo - Informations sur la connexion
   * @returns {Object} Session et statut de su00e9curitu00e9
   */
  recordSuccessfulLogin(userId, connectionInfo) {
    const isSuspicious = this.detectSuspiciousLogin(userId, connectionInfo);
    
    // Enregistrer la session
    const sessionId = crypto.randomBytes(16).toString('hex');
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ip: connectionInfo.ip,
      userAgent: connectionInfo.userAgent,
      suspicious: isSuspicious
    };
    
    this.sessions.set(sessionId, session);
    
    return {
      sessionId,
      requireAdditionalVerification: isSuspicious
    };
  }

  /**
   * Enregistre une tentative de connexion u00e9chouu00e9e
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} connectionInfo - Informations sur la connexion
   */
  recordFailedLogin(userId, connectionInfo) {
    if (!this.loginAttempts.has(userId)) {
      this.loginAttempts.set(userId, []);
    }
    
    const userHistory = this.loginAttempts.get(userId);
    
    userHistory.push({
      timestamp: new Date(),
      ip: connectionInfo.ip,
      userAgent: connectionInfo.userAgent,
      geo: geoip.lookup(connectionInfo.ip),
      failed: true
    });
    
    // Du00e9tecter les attaques par force brute
    const recentFailedAttempts = userHistory
      .filter(a => a.timestamp > new Date(Date.now() - 30 * 60 * 1000) && a.failed)
      .length;
    
    if (recentFailedAttempts >= this.userSuspiciousLoginThreshold) {
      this.suspiciousActivities.push({
        userId,
        timestamp: new Date(),
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent,
        reason: 'Possible brute force attack'
      });
    }
  }
  
  /**
   * Vu00e9rifie si une session est active et valide
   * @param {string} sessionId - ID de la session
   * @returns {Object|null} Session si valide, null sinon
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return null;
    }
    
    const session = this.sessions.get(sessionId);
    // Vu00e9rifier si la session a expiru00e9 (24h par du00e9faut)
    const now = new Date();
    if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    // Mettre u00e0 jour la derniu00e8re activitu00e9
    session.lastActivity = now;
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Gu00e9nu00e8re un code de ru00e9cupu00e9ration pour la ru00e9initialisation de mot de passe
   * @returns {string} Code de ru00e9cupu00e9ration
   */
  generateRecoveryCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * GDPR: Anonymise les donnu00e9es d'un utilisateur
   * @param {Object} userData - Donnu00e9es utilisateur u00e0 anonymiser
   * @returns {Object} Donnu00e9es anonymisu00e9es
   */
  anonymizeUserData(userData) {
    // Cru00e9er une copie pour ne pas modifier l'original
    const anonymized = { ...userData };
    
    // Champs u00e0 anonymiser
    const fieldsToAnonymize = ['name', 'email', 'phone', 'address'];
    
    fieldsToAnonymize.forEach(field => {
      if (anonymized[field]) {
        // Remplacer par une valeur anonymisu00e9e
        anonymized[field] = `ANONYMIZED-${crypto.randomBytes(8).toString('hex')}`;
      }
    });
    
    return anonymized;
  }

  /**
   * GDPR: Extrait toutes les donnu00e9es relatives u00e0 un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} dataSources - Sources de donnu00e9es u00e0 interroger
   * @returns {Object} Toutes les donnu00e9es de l'utilisateur
   */
  async extractUserDataForGDPR(userId, dataSources) {
    const userDataReport = {
      userId,
      generatedAt: new Date().toISOString(),
      personalData: {},
      activityData: {}
    };
    
    // Implu00e9mentation ru00e9elle: interroger la base de donnu00e9es et d'autres sources
    // pour extraire toutes les donnu00e9es personnelles de l'utilisateur
    
    return userDataReport;
  }

  /**
   * Vu00e9rifie la conformitu00e9 FERPA pour l'accu00e8s aux donnu00e9es d'un u00e9lu00e8ve
   * @param {string} requesterId - ID de la personne demandant l'accu00e8s
   * @param {string} studentId - ID de l'u00e9lu00e8ve
   * @param {Object} userRoles - Ru00f4les des utilisateurs
   * @returns {boolean} Accu00e8s autorisu00e9 ou non
   */
  checkFERPACompliance(requesterId, studentId, userRoles) {
    // Vu00e9rifier si le demandeur est:
    // 1. L'enseignant de l'u00e9lu00e8ve
    // 2. Un administrateur avec des droits appropriu00e9s
    // 3. Un parent/tuteur de l'u00e9lu00e8ve
    // 4. L'u00e9lu00e8ve lui-mu00eame s'il est majeur
    
    // Implu00e9mentation exemplarive - u00e0 remplacer par une logique ru00e9elle
    const requesterRole = userRoles[requesterId];
    
    if (requesterId === studentId) {
      return true; // L'u00e9lu00e8ve accu00e8de u00e0 ses propres donnu00e9es
    }
    
    if (requesterRole.isTeacherOf && requesterRole.isTeacherOf.includes(studentId)) {
      return true; // L'enseignant de l'u00e9lu00e8ve
    }
    
    if (requesterRole.isParentOf && requesterRole.isParentOf.includes(studentId)) {
      return true; // Parent/tuteur de l'u00e9lu00e8ve
    }
    
    if (requesterRole.isAdmin && requesterRole.permissions.includes('view_student_data')) {
      return true; // Administrateur avec permissions appropriu00e9es
    }
    
    return false; // Accu00e8s refusu00e9 par du00e9faut
  }
}

module.exports = SecurityService;
