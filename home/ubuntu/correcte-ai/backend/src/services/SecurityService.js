const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { logger } = require('../utils/logger');

/**
 * Service de sécurité pour l'authentification, l'autorisation et le chiffrement
 * Fournit des méthodes pour la gestion des tokens JWT, l'authentification à deux facteurs,
 * et le chiffrement/déchiffrement des données sensibles
 */
class SecurityService {
  constructor(config = {}) {
    const {
      jwtSecret = process.env.JWT_SECRET,
      jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d',
      bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
      encryptionKey = process.env.ENCRYPTION_KEY,
      encryptionIv = process.env.ENCRYPTION_IV,
      algorithm = 'aes-256-cbc'
    } = config;

    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.bcryptSaltRounds = bcryptSaltRounds;
    this.encryptionKey = encryptionKey;
    this.encryptionIv = encryptionIv;
    this.algorithm = algorithm;

    // Vérifier que les clés nécessaires sont présentes
    this._validateConfig();
  }

  /**
   * Valide la configuration de sécurité
   * @private
   */
  _validateConfig() {
    if (!this.jwtSecret) {
      logger.warn('JWT_SECRET non défini. Utilisation d\'une valeur par défaut (non recommandé pour la production)');
      this.jwtSecret = 'correcte-ai-default-secret-key';
    }

    if (!this.encryptionKey || !this.encryptionIv) {
      logger.warn('ENCRYPTION_KEY ou ENCRYPTION_IV non définis. Le chiffrement/déchiffrement ne sera pas disponible.');
    }
  }

  /**
   * Hache un mot de passe avec bcrypt
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<string>} Mot de passe haché
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.bcryptSaltRounds);
    } catch (error) {
      logger.error(`Erreur lors du hachage du mot de passe: ${error.message}`, { error });
      throw new Error('Échec du hachage du mot de passe');
    }
  }

  /**
   * Compare un mot de passe en clair avec un mot de passe haché
   * @param {string} password - Mot de passe en clair
   * @param {string} hashedPassword - Mot de passe haché
   * @returns {Promise<boolean>} Résultat de la comparaison
   */
  async comparePasswords(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error(`Erreur lors de la comparaison des mots de passe: ${error.message}`, { error });
      throw new Error('Échec de la vérification du mot de passe');
    }
  }

  /**
   * Génère un token JWT
   * @param {Object} payload - Données à inclure dans le token
   * @param {Object} options - Options supplémentaires pour le token
   * @returns {string} Token JWT
   */
  generateToken(payload, options = {}) {
    try {
      const tokenOptions = {
        expiresIn: options.expiresIn || this.jwtExpiresIn,
        ...options
      };

      return jwt.sign(payload, this.jwtSecret, tokenOptions);
    } catch (error) {
      logger.error(`Erreur lors de la génération du token JWT: ${error.message}`, { error });
      throw new Error('Échec de la génération du token');
    }
  }

  /**
   * Vérifie et décode un token JWT
   * @param {string} token - Token JWT à vérifier
   * @returns {Object} Payload décodé
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error(`Erreur lors de la vérification du token JWT: ${error.message}`, { error });
      throw new Error(`Token invalide: ${error.message}`);
    }
  }

  /**
   * Configure l'authentification à deux facteurs pour un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} email - Email de l'utilisateur pour l'étiquette
   * @returns {Promise<Object>} Informations de configuration 2FA
   */
  async setupTwoFactorAuth(userId, email) {
    try {
      // Générer un secret pour l'utilisateur
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `Correcte-AI (${email})`
      });

      // Générer un QR code pour configurer l'authentificateur
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Générer des codes de secours
      const backupCodes = this._generateBackupCodes(8);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logger.error(`Erreur lors de la configuration 2FA: ${error.message}`, { error });
      throw new Error('Échec de la configuration de l\'authentification à deux facteurs');
    }
  }

  /**
   * Vérifie un code d'authentification à deux facteurs
   * @param {string} token - Code fourni par l'utilisateur
   * @param {string} secret - Secret de l'utilisateur
   * @returns {boolean} Résultat de la vérification
   */
  verifyTwoFactorToken(token, secret) {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: token.toString(),
        window: 1  // Tolérance de +/- 1 intervalle de temps (30 secondes par défaut)
      });
    } catch (error) {
      logger.error(`Erreur lors de la vérification du code 2FA: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Génère des codes de secours aléatoires pour la 2FA
   * @private
   * @param {number} count - Nombre de codes à générer
   * @returns {Array<string>} Codes de secours générés
   */
  _generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Format: XXXX-XXXX-XXXX
      const code = `${this._randomDigits(4)}-${this._randomDigits(4)}-${this._randomDigits(4)}`;
      codes.push(code);
    }
    return codes;
  }

  /**
   * Génère une chaîne de chiffres aléatoires
   * @private
   * @param {number} length - Longueur de la chaîne
   * @returns {string} Chaîne de chiffres aléatoires
   */
  _randomDigits(length) {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }

  /**
   * Chiffre des données sensibles
   * @param {string} data - Données à chiffrer
   * @returns {string} Données chiffrées en format hexadécimal
   */
  encrypt(data) {
    if (!this.encryptionKey || !this.encryptionIv) {
      throw new Error('Clés de chiffrement non configurées');
    }

    try {
      // Convertir les clés en format attendu par crypto
      const key = Buffer.from(this.encryptionKey);
      const iv = Buffer.from(this.encryptionIv);

      // Créer un chiffreur
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Chiffrer les données
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return encrypted;
    } catch (error) {
      logger.error(`Erreur lors du chiffrement: ${error.message}`, { error });
      throw new Error('Échec du chiffrement des données');
    }
  }

  /**
   * Déchiffre des données sensibles
   * @param {string} encryptedData - Données chiffrées en format hexadécimal
   * @returns {string} Données déchiffrées
   */
  decrypt(encryptedData) {
    if (!this.encryptionKey || !this.encryptionIv) {
      throw new Error('Clés de chiffrement non configurées');
    }

    try {
      // Convertir les clés en format attendu par crypto
      const key = Buffer.from(this.encryptionKey);
      const iv = Buffer.from(this.encryptionIv);

      // Créer un déchiffreur
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      // Déchiffrer les données
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error(`Erreur lors du déchiffrement: ${error.message}`, { error });
      throw new Error('Échec du déchiffrement des données');
    }
  }

  /**
   * Génère un jeton anti-CSRF pour la protection des formulaires
   * @param {string} sessionId - Identifiant de session
   * @returns {string} Jeton CSRF
   */
  generateCsrfToken(sessionId) {
    try {
      return crypto
        .createHmac('sha256', this.jwtSecret)
        .update(sessionId + Date.now().toString())
        .digest('hex');
    } catch (error) {
      logger.error(`Erreur lors de la génération du jeton CSRF: ${error.message}`, { error });
      throw new Error('Échec de la génération du jeton CSRF');
    }
  }

  /**
   * Vérifie si un jeton anti-CSRF est valide
   * @param {string} token - Jeton CSRF à vérifier
   * @param {string} storedToken - Jeton CSRF stocké
   * @returns {boolean} Résultat de la vérification
   */
  verifyCsrfToken(token, storedToken) {
    try {
      // Comparaison en temps constant pour éviter les attaques temporelles
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(storedToken)
      );
    } catch (error) {
      logger.error(`Erreur lors de la vérification du jeton CSRF: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Génère un mot de passe aléatoire et sécurisé
   * @param {number} length - Longueur du mot de passe (défaut: 12)
   * @param {Object} options - Options pour la génération
   * @returns {string} Mot de passe généré
   */
  generateSecurePassword(length = 12, options = {}) {
    const { includeLowercase = true, includeUppercase = true, includeNumbers = true, includeSymbols = true } = options;
    
    try {
      let charset = '';
      if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (includeNumbers) charset += '0123456789';
      if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

      if (charset.length === 0) {
        throw new Error('Au moins un type de caractères doit être inclus');
      }

      // Générer le mot de passe
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % charset.length;
        password += charset[randomIndex];
      }

      return password;
    } catch (error) {
      logger.error(`Erreur lors de la génération du mot de passe: ${error.message}`, { error });
      throw new Error('Échec de la génération du mot de passe sécurisé');
    }
  }
}

module.exports = SecurityService;
