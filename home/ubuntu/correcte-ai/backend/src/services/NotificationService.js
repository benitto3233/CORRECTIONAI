const { logger } = require('../utils/logger');

/**
 * Service pour gu00e9rer les notifications utilisateur
 * Prend en charge les notifications in-app et email
 */
class NotificationService {
  constructor(config = {}) {
    const {
      queueService,
      emailService,
      defaultSender = 'Correcte-AI <notifications@correcte-ai.com>',
      maxRetries = 3
    } = config;

    this.queueService = queueService;
    this.emailService = emailService;
    this.defaultSender = defaultSender;
    this.maxRetries = maxRetries;
    this.notificationQueue = 'notifications';

    // Initialiser la file d'attente de notifications si le service de queue est disponible
    this._initQueue();
  }

  /**
   * Initialise la file d'attente de notifications
   * @private
   */
  async _initQueue() {
    if (this.queueService) {
      try {
        // Cru00e9er la file d'attente de notifications
        await this.queueService.assertQueue(this.notificationQueue, { durable: true });

        // Consommer les messages de la file d'attente
        await this.queueService.consume(this.notificationQueue, async (message) => {
          try {
            await this._processNotification(message);
          } catch (error) {
            logger.error(`Erreur lors du traitement de la notification: ${error.message}`, { error });

            // Ru00e9-essayer si possible
            if (message.retryCount < this.maxRetries) {
              message.retryCount = (message.retryCount || 0) + 1;
              await this.queueService.sendToQueue(this.notificationQueue, message, {
                delay: 1000 * Math.pow(2, message.retryCount) // Retard exponentiel
              });
            }
          }
        });

        logger.info('File d\'attente de notifications initialisu00e9e');
      } catch (error) {
        logger.error(`Erreur lors de l'initialisation de la file d'attente de notifications: ${error.message}`, { error });
      }
    }
  }

  /**
   * Traite une notification depuis la file d'attente
   * @private
   * @param {Object} message - Le message de notification
   */
  async _processNotification(message) {
    const { type, user, data } = message;

    logger.debug(`Traitement de la notification de type ${type}`);

    switch (type) {
      case 'email':
        await this._sendEmail(user, data);
        break;
      case 'in-app':
        await this._saveInAppNotification(user, data);
        break;
      case 'push':
        await this._sendPushNotification(user, data);
        break;
      default:
        logger.warn(`Type de notification inconnu: ${type}`);
    }
  }

  /**
   * Sauvegarde une notification in-app dans la base de donnu00e9es
   * @private
   * @param {string} userId - ID de l'utilisateur u00e0 notifier
   * @param {Object} data - Donnu00e9es de la notification
   */
  async _saveInAppNotification(userId, data) {
    try {
      const Notification = require('../models/Notification');

      const notification = new Notification({
        user: userId,
        title: data.title,
        message: data.message,
        type: data.notificationType || 'info',
        link: data.link,
        metadata: data.metadata
      });

      await notification.save();
      logger.info(`Notification in-app cru00e9u00e9e pour l'utilisateur ${userId}`);

      // TODO: u00c9mettre un u00e9vu00e9nement WebSocket si implu00e9mentu00e9
    } catch (error) {
      logger.error(`u00c9chec de cru00e9ation de la notification in-app: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Envoie un email u00e0 l'utilisateur
   * @private
   * @param {string|Object} user - ID de l'utilisateur ou objet utilisateur
   * @param {Object} data - Donnu00e9es de l'email
   */
  async _sendEmail(user, data) {
    try {
      if (!this.emailService) {
        throw new Error('Service d\'email non configuru00e9');
      }

      // Ru00e9cupu00e9rer les du00e9tails de l'utilisateur si nu00e9cessaire
      let userEmail;
      let userName;

      if (typeof user === 'string') {
        const User = require('../models/User');
        const userDoc = await User.findById(user);
        if (!userDoc) {
          throw new Error(`Utilisateur ${user} non trouvu00e9`);
        }
        userEmail = userDoc.email;
        userName = userDoc.name;
      } else {
        userEmail = user.email;
        userName = user.name;
      }

      // Vu00e9rifier que l'email est disponible
      if (!userEmail) {
        throw new Error('Email de l\'utilisateur non disponible');
      }

      // Construire l'email
      const emailOptions = {
        from: data.from || this.defaultSender,
        to: userEmail,
        subject: data.subject,
        html: data.html || data.message,
        text: data.text || this._stripHtml(data.html) || data.message
      };

      // Envoyer l'email
      await this.emailService.sendMail(emailOptions);
      logger.info(`Email envoyu00e9 u00e0 ${userEmail}`);
    } catch (error) {
      logger.error(`u00c9chec d'envoi d'email: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Envoie une notification push
   * @private
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} data - Donnu00e9es de la notification
   */
  async _sendPushNotification(userId, data) {
    // TODO: Implu00e9menter les notifications push avec un service comme Firebase
    logger.warn('Les notifications push ne sont pas encore implu00e9mentu00e9es');
  }

  /**
   * Enlu00e8ve les balises HTML d'une chau00eene
   * @private
   * @param {string} html - Chau00eene HTML
   * @returns {string} Texte sans HTML
   */
  _stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Envoie une notification u00e0 un utilisateur
   * @param {string} userId - ID de l'utilisateur u00e0 notifier
   * @param {Object} notification - Du00e9tails de la notification
   * @param {string} notification.title - Titre de la notification
   * @param {string} notification.message - Message de la notification
   * @param {string} [notification.type='info'] - Type de notification (in-app, email, sms, push, all)
   * @param {string} [notification.notificationType='info'] - Catu00e9gorie de notification (info, success, warning, error)
   * @param {string} [notification.link] - Lien optionnel associu00e9 u00e0 la notification
   * @param {Object} [notification.metadata] - Mu00e9tadonnu00e9es supplu00e9mentaires
   * @returns {Promise<boolean>} Succu00e8s de l'envoi
   */
  async sendNotification(userId, notification) {
    try {
      const { title, message, type = 'in-app', notificationType = 'info', link, metadata } = notification;

      // Vu00e9rifier les paramu00e8tres requis
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      if (!title || !message) {
        throw new Error('Titre et message requis');
      }

      // Obtenir les pru00e9fu00e9rences de notification de l'utilisateur
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) {
        throw new Error(`Utilisateur ${userId} non trouvu00e9`);
      }

      // Cru00e9er le message de notification
      const notificationMessage = {
        user: userId,
        title,
        message,
        notificationType,
        link,
        metadata,
        retryCount: 0,
        createdAt: new Date()
      };

      // Du00e9terminer quels types de notifications envoyer en fonction des pru00e9fu00e9rences
      let typesToSend = [];

      if (type === 'all') {
        typesToSend = ['in-app'];

        // Ajouter email si autorisu00e9 dans les pru00e9fu00e9rences
        if (user.preferences?.notifications?.email !== false) {
          typesToSend.push('email');
        }

        // Ajouter push si autorisu00e9 dans les pru00e9fu00e9rences
        if (user.preferences?.notifications?.app !== false) {
          typesToSend.push('push');
        }
      } else {
        typesToSend = [type];
      }

      // Envoyer les notifications pour chaque type
      for (const notificationType of typesToSend) {
        const message = { ...notificationMessage, type: notificationType };

        if (this.queueService) {
          // Envoyer u00e0 la file d'attente pour traitement asynchrone
          await this.queueService.sendToQueue(this.notificationQueue, message);
          logger.debug(`Notification ${notificationType} mise en file d'attente pour l'utilisateur ${userId}`);
        } else {
          // Traiter immu00e9diatement si pas de file d'attente
          await this._processNotification(message);
        }
      }

      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de notification: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Envoie une notification de groupe u00e0 plusieurs utilisateurs
   * @param {Array<string>} userIds - Liste des IDs utilisateurs
   * @param {Object} notification - Du00e9tails de la notification
   * @returns {Promise<{success: number, failed: number}>} Nombre de notifications ru00e9ussies et u00e9chouu00e9es
   */
  async sendGroupNotification(userIds, notification) {
    const results = { success: 0, failed: 0 };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      logger.warn('Aucun destinataire spu00e9cifiu00e9 pour la notification de groupe');
      return results;
    }

    // Envoyer la notification u00e0 chaque utilisateur
    for (const userId of userIds) {
      try {
        const success = await this.sendNotification(userId, notification);
        if (success) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        logger.error(`u00c9chec d'envoi de notification u00e0 l'utilisateur ${userId}: ${error.message}`, { error });
      }
    }

    logger.info(`Notification de groupe envoyu00e9e: ${results.success} ru00e9ussies, ${results.failed} u00e9chouu00e9es`);
    return results;
  }

  /**
   * Marque une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur propriu00e9taire
   * @returns {Promise<boolean>} Succu00e8s de l'opu00e9ration
   */
  async markAsRead(notificationId, userId) {
    try {
      const Notification = require('../models/Notification');
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      return !!result;
    } catch (error) {
      logger.error(`Erreur lors du marquage de la notification comme lue: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications marquu00e9es comme lues
   */
  async markAllAsRead(userId) {
    try {
      const Notification = require('../models/Notification');
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );

      return result.nModified || 0;
    } catch (error) {
      logger.error(`Erreur lors du marquage de toutes les notifications comme lues: ${error.message}`, { error });
      return 0;
    }
  }

  /**
   * Ru00e9cupu00e8re les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @param {boolean} [options.unreadOnly=false] - Ru00e9cupu00e9rer uniquement les notifications non lues
   * @param {number} [options.limit=10] - Nombre maximum de notifications u00e0 ru00e9cupu00e9rer
   * @param {number} [options.skip=0] - Nombre de notifications u00e0 sauter
   * @param {string} [options.sort='-createdAt'] - Champ de tri (-createdAt pour ordre du00e9croissant)
   * @returns {Promise<Array<Object>>} Liste des notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { unreadOnly = false, limit = 10, skip = 0, sort = '-createdAt' } = options;
      const Notification = require('../models/Notification');

      const query = { user: userId };
      if (unreadOnly) {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      return notifications;
    } catch (error) {
      logger.error(`Erreur lors de la ru00e9cupu00e9ration des notifications: ${error.message}`, { error });
      return [];
    }
  }

  /**
   * Compte les notifications non lues d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications non lues
   */
  async countUnreadNotifications(userId) {
    try {
      const Notification = require('../models/Notification');
      return await Notification.countDocuments({ user: userId, read: false });
    } catch (error) {
      logger.error(`Erreur lors du comptage des notifications non lues: ${error.message}`, { error });
      return 0;
    }
  }
}

module.exports = NotificationService;
