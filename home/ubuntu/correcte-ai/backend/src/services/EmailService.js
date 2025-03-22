const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { logger } = require('../utils/logger');

/**
 * Service pour la gestion des emails
 */
class EmailService {
  constructor(config = {}) {
    const {
      host = process.env.EMAIL_HOST,
      port = process.env.EMAIL_PORT,
      user = process.env.EMAIL_USER,
      pass = process.env.EMAIL_PASS,
      secure = process.env.EMAIL_SECURE === 'true',
      defaultFrom = process.env.EMAIL_FROM || 'Correcte-AI <noreply@correcte-ai.com>',
      templatesDir = path.join(__dirname, '../../templates/emails')
    } = config;

    this.config = { host, port, user, pass, secure };
    this.defaultFrom = defaultFrom;
    this.templatesDir = templatesDir;
    this.transporter = null;
    
    // Initialiser le transporteur email
    this._initTransporter();
  }

  /**
   * Initialise le transporteur d'emails
   * @private
   */
  _initTransporter() {
    try {
      if (!this.config.host || !this.config.port) {
        logger.warn('Configuration SMTP incomplu00e8te, EmailService fonctionnera en mode simulu00e9');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.user && this.config.pass ? {
          user: this.config.user,
          pass: this.config.pass
        } : undefined,
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('Transporteur email initialisu00e9');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du transporteur email: ${error.message}`, { error });
    }
  }

  /**
   * Vu00e9rifie si le transporteur est configuru00e9
   * @returns {boolean} L'u00e9tat de configuration du transporteur
   */
  isConfigured() {
    return !!this.transporter;
  }

  /**
   * Vu00e9rifie la connexion avec le serveur SMTP
   * @returns {Promise<boolean>} Ru00e9sultat de la vu00e9rification
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Connexion SMTP vu00e9rifiu00e9e avec succu00e8s');
      return true;
    } catch (error) {
      logger.error(`u00c9chec de la vu00e9rification SMTP: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Charge un template d'email
   * @private
   * @param {string} templateName - Nom du template
   * @returns {Promise<Function>} Fonction de compilation du template
   */
  async _loadTemplate(templateName) {
    try {
      const filePath = path.join(this.templatesDir, `${templateName}.html`);
      const templateSource = await fs.promises.readFile(filePath, 'utf8');
      return handlebars.compile(templateSource);
    } catch (error) {
      logger.error(`Erreur lors du chargement du template ${templateName}: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Gu00e9nu00e8re le contenu HTML d'un email u00e0 partir d'un template
   * @private
   * @param {string} templateName - Nom du template
   * @param {Object} data - Donnu00e9es u00e0 injecter dans le template
   * @returns {Promise<string>} Contenu HTML gu00e9nu00e9ru00e9
   */
  async _renderTemplate(templateName, data = {}) {
    try {
      const template = await this._loadTemplate(templateName);
      return template(data);
    } catch (error) {
      // Si le template n'est pas trouvu00e9, retourner les donnu00e9es brutes ou un message par du00e9faut
      logger.warn(`Template ${templateName} non trouvu00e9, utilisation du contenu brut`);
      return data.html || data.message || 'Aucun contenu disponible';
    }
  }

  /**
   * Extrait le texte brut d'un contenu HTML
   * @private
   * @param {string} html - Contenu HTML
   * @returns {string} Texte brut
   */
  _htmlToText(html) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Envoie un email
   * @param {Object} options - Options de l'email
   * @param {string} options.to - Destinataire
   * @param {string} options.subject - Sujet de l'email
   * @param {string} [options.html] - Contenu HTML de l'email
   * @param {string} [options.text] - Contenu texte de l'email
   * @param {string} [options.from] - Expu00e9diteur (utilise defaultFrom par du00e9faut)
   * @param {Array<Object>} [options.attachments] - Piu00e8ces jointes
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendMail(options) {
    if (!this.transporter) {
      logger.warn('Transporteur email non configuru00e9, email simulu00e9:', options);
      return { messageId: `simulated-${Date.now()}`, simulated: true };
    }

    try {
      // Complu00e9ter les options manquantes
      const mailOptions = {
        from: options.from || this.defaultFrom,
        ...options
      };

      // Gu00e9nu00e9rer le texte brut si non fourni
      if (mailOptions.html && !mailOptions.text) {
        mailOptions.text = this._htmlToText(mailOptions.html);
      }

      // Envoyer l'email
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email envoyu00e9 avec succu00e8s: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`, { error, recipient: options.to });
      throw error;
    }
  }

  /**
   * Envoie un email en utilisant un template
   * @param {string} to - Destinataire
   * @param {string} subject - Sujet de l'email
   * @param {string} templateName - Nom du template
   * @param {Object} data - Donnu00e9es u00e0 injecter dans le template
   * @param {Object} [options] - Options supplu00e9mentaires
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendTemplateEmail(to, subject, templateName, data = {}, options = {}) {
    try {
      // Gu00e9nu00e9rer le contenu HTML u00e0 partir du template
      const html = await this._renderTemplate(templateName, data);

      // Envoyer l'email
      return await this.sendMail({
        to,
        subject,
        html,
        ...options
      });
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de l'email avec template: ${error.message}`, { error, template: templateName });
      throw error;
    }
  }

  /**
   * Envoie un email de bienvenue
   * @param {string} to - Adresse email du destinataire
   * @param {Object} userData - Informations sur l'utilisateur
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendWelcomeEmail(to, userData) {
    return this.sendTemplateEmail(
      to,
      'Bienvenue sur Correcte-AI!',
      'welcome',
      userData
    );
  }

  /**
   * Envoie un email de ru00e9initialisation de mot de passe
   * @param {string} to - Adresse email du destinataire
   * @param {Object} data - Donnu00e9es incluant le token de ru00e9initialisation
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendPasswordResetEmail(to, data) {
    return this.sendTemplateEmail(
      to,
      'Ru00e9initialisation de votre mot de passe',
      'password-reset',
      data
    );
  }

  /**
   * Envoie une notification d'assignation corrigu00e9e
   * @param {string} to - Adresse email du destinataire
   * @param {Object} data - Donnu00e9es sur l'assignation
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendGradedAssignmentEmail(to, data) {
    return this.sendTemplateEmail(
      to,
      `Correction terminu00e9e: ${data.assignmentTitle || 'Assignation'}`,
      'graded-assignment',
      data
    );
  }

  /**
   * Envoie un rapport hebdomadaire
   * @param {string} to - Adresse email du destinataire
   * @param {Object} reportData - Donnu00e9es du rapport
   * @returns {Promise<Object>} Ru00e9sultat de l'envoi
   */
  async sendWeeklyReportEmail(to, reportData) {
    return this.sendTemplateEmail(
      to,
      `Rapport hebdomadaire: ${reportData.weekRange || 'Semaine actuelle'}`,
      'weekly-report',
      reportData
    );
  }
}

module.exports = EmailService;
