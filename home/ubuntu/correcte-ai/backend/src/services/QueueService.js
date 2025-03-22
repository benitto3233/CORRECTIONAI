const amqp = require('amqplib');
const { logger } = require('../utils/logger');

/**
 * Service de gestion des files d'attente
 * Utilise RabbitMQ pour gu00e9rer les tu00e2ches asynchrones comme le traitement des images,
 * les notifications et les tu00e2ches d'analyse de donnu00e9es
 */
class QueueService {
  constructor(config = {}) {
    const {
      rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost',
      reconnectTimeout = 5000,
      defaultExchange = 'correcte-ai',
      defaultOptions = { durable: true }
    } = config;

    this.rabbitmqUrl = rabbitmqUrl;
    this.reconnectTimeout = reconnectTimeout;
    this.defaultExchange = defaultExchange;
    this.defaultOptions = defaultOptions;
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
    this.consumers = new Map();
  }

  /**
   * u00c9tablit la connexion u00e0 RabbitMQ
   * @returns {Promise<amqp.Connection>} La connexion u00e9tablie
   */
  async connect() {
    if (this.connection) return this.connection;
    if (this.isConnecting) {
      // Attendre que la connexion en cours soit terminu00e9e
      return new Promise(resolve => {
        const checkConnection = setInterval(() => {
          if (this.connection) {
            clearInterval(checkConnection);
            resolve(this.connection);
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    try {
      logger.info(`Connexion u00e0 RabbitMQ: ${this.rabbitmqUrl}`);
      this.connection = await amqp.connect(this.rabbitmqUrl);

      // Gu00e9rer les u00e9vu00e9nements de connexion
      this.connection.on('error', (err) => {
        logger.error(`Erreur de connexion RabbitMQ: ${err.message}`, { error: err });
        this._reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('Connexion RabbitMQ fermu00e9e');
        this.connection = null;
        this.channel = null;
        this._reconnect();
      });

      // Cru00e9er un canal par du00e9faut
      await this.createChannel();

      this.isConnecting = false;
      logger.info('Connectu00e9 u00e0 RabbitMQ avec succu00e8s');

      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      logger.error(`u00c9chec de connexion u00e0 RabbitMQ: ${error.message}`, { error });
      this._reconnect();
      throw error;
    }
  }

  /**
   * Cru00e9e un canal RabbitMQ
   * @returns {Promise<amqp.Channel>} Le canal cru00e9u00e9
   */
  async createChannel() {
    if (!this.connection) {
      await this.connect();
    }

    if (this.channel) return this.channel;

    try {
      this.channel = await this.connection.createChannel();

      // Gu00e9rer les u00e9vu00e9nements de canal
      this.channel.on('error', (err) => {
        logger.error(`Erreur de canal RabbitMQ: ${err.message}`, { error: err });
        this.channel = null;
      });

      this.channel.on('close', () => {
        logger.warn('Canal RabbitMQ fermu00e9');
        this.channel = null;
      });

      // Cru00e9er l'u00e9change par du00e9faut
      await this.channel.assertExchange(this.defaultExchange, 'direct', this.defaultOptions);

      return this.channel;
    } catch (error) {
      logger.error(`u00c9chec de cru00e9ation du canal RabbitMQ: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Tente de se reconnecter u00e0 RabbitMQ apru00e8s un du00e9lai
   * @private
   */
  _reconnect() {
    if (this.isConnecting) return;

    setTimeout(async () => {
      logger.info('Tentative de reconnexion u00e0 RabbitMQ...');
      try {
        await this.connect();
        
        // Ru00e9tablir les consommateurs apru00e8s reconnexion
        await this._restoreConsumers();
      } catch (error) {
        logger.error(`u00c9chec de reconnexion u00e0 RabbitMQ: ${error.message}`, { error });
      }
    }, this.reconnectTimeout);
  }

  /**
   * Ru00e9tablit les consommateurs enregistru00e9s apru00e8s une reconnexion
   * @private
   */
  async _restoreConsumers() {
    if (this.consumers.size === 0) return;

    try {
      for (const [queue, { options, handler }] of this.consumers.entries()) {
        await this.consume(queue, handler, options);
        logger.info(`Consommateur ru00e9tabli pour la file: ${queue}`);
      }
    } catch (error) {
      logger.error(`u00c9chec de ru00e9tablissement des consommateurs: ${error.message}`, { error });
    }
  }

  /**
   * Du00e9clare une file d'attente
   * @param {string} queue - Nom de la file d'attente
   * @param {Object} options - Options de la file
   * @returns {Promise<amqp.Replies.AssertQueue>} Ru00e9sultat de la du00e9claration
   */
  async assertQueue(queue, options = this.defaultOptions) {
    if (!this.channel) {
      await this.createChannel();
    }

    try {
      return await this.channel.assertQueue(queue, options);
    } catch (error) {
      logger.error(`u00c9chec de du00e9claration de la file ${queue}: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Envoie un message u00e0 une file d'attente
   * @param {string} queue - Nom de la file d'attente
   * @param {Object|string} message - Message u00e0 envoyer
   * @param {Object} options - Options de publication
   * @returns {Promise<boolean>} Succu00e8s de l'envoi
   */
  async sendToQueue(queue, message, options = {}) {
    if (!this.channel) {
      await this.createChannel();
    }

    try {
      // S'assurer que la file existe
      await this.assertQueue(queue);

      // Convertir le message en Buffer
      const content = Buffer.from(
        typeof message === 'string' ? message : JSON.stringify(message)
      );

      // Publier le message
      const result = this.channel.sendToQueue(queue, content, {
        persistent: true,
        timestamp: Date.now(),
        ...options
      });

      return result;
    } catch (error) {
      logger.error(`u00c9chec d'envoi u00e0 la file ${queue}: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Publie un message sur un u00e9change
   * @param {string} exchange - Nom de l'u00e9change
   * @param {string} routingKey - Clu00e9 de routage
   * @param {Object|string} message - Message u00e0 publier
   * @param {Object} options - Options de publication
   * @returns {Promise<boolean>} Succu00e8s de la publication
   */
  async publish(exchange, routingKey, message, options = {}) {
    if (!this.channel) {
      await this.createChannel();
    }

    try {
      // Convertir le message en Buffer
      const content = Buffer.from(
        typeof message === 'string' ? message : JSON.stringify(message)
      );

      // Publier le message
      const result = this.channel.publish(exchange || this.defaultExchange, routingKey, content, {
        persistent: true,
        timestamp: Date.now(),
        ...options
      });

      return result;
    } catch (error) {
      logger.error(`u00c9chec de publication sur l'u00e9change ${exchange}: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Consomme les messages d'une file d'attente
   * @param {string} queue - Nom de la file d'attente
   * @param {Function} handler - Fonction de traitement des messages
   * @param {Object} options - Options de consommation
   * @returns {Promise<string>} Tag de consommation
   */
  async consume(queue, handler, options = {}) {
    if (!this.channel) {
      await this.createChannel();
    }

    try {
      // S'assurer que la file existe
      await this.assertQueue(queue);

      // Enregistrer le consommateur pour pouvoir le ru00e9tablir en cas de reconnexion
      this.consumers.set(queue, { options, handler });

      // Du00e9finir le pru00e9fixe de consommation
      const prefetch = options.prefetch || 1;
      await this.channel.prefetch(prefetch);

      // Consommer les messages
      const { consumerTag } = await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          // Convertir le contenu du message
          const content = msg.content.toString();
          let parsedContent;

          try {
            parsedContent = JSON.parse(content);
          } catch (parseError) {
            parsedContent = content;
          }

          // Exu00e9cuter le gestionnaire avec le contenu et les propriu00e9tu00e9s du message
          await handler(parsedContent, msg.properties);

          // Accuser ru00e9ception du message
          this.channel.ack(msg);
        } catch (handlerError) {
          logger.error(`Erreur lors du traitement du message: ${handlerError.message}`, {
            error: handlerError,
            queue
          });

          // Si configu00e9 pour rejeter en cas d'erreur, rejeter le message
          if (options.rejectOnError) {
            this.channel.reject(msg, options.requeue !== false);
          } else {
            // Sinon, accuser ru00e9ception mu00eame en cas d'erreur
            this.channel.ack(msg);
          }
        }
      }, options);

      logger.info(`Consommateur enregistru00e9 pour la file ${queue} avec tag: ${consumerTag}`);
      return consumerTag;
    } catch (error) {
      logger.error(`u00c9chec de consommation de la file ${queue}: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Ferme la connexion RabbitMQ proprement
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      logger.info('Connexion RabbitMQ fermu00e9e proprement');
    } catch (error) {
      logger.error(`Erreur lors de la fermeture de la connexion RabbitMQ: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = QueueService;
