const amqp = require('amqplib');

/**
 * Service de file d'attente asynchrone pour les tâches intensives
 * Utilise RabbitMQ pour distribuer le traitement
 */
class QueueService {
  constructor(config = {}) {
    const {
      url = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
      exchange = 'correcte_ai_exchange',
      queues = {
        grading: 'grading_queue',
        ocr: 'ocr_queue',
        content_generation: 'content_generation_queue',
        analytics: 'analytics_queue'
      },
      prefetch = 1
    } = config;

    this.url = url;
    this.exchange = exchange;
    this.queues = queues;
    this.prefetch = prefetch;
    this.connection = null;
    this.channel = null;
    this.consumers = new Map();
  }

  /**
   * Initialise la connexion à RabbitMQ et configure l'échange et les files
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Configurer le canal pour ne pas accepter plus de messages que préfetch
      await this.channel.prefetch(this.prefetch);
      
      // Créer un échange de type topic
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      
      // Créer toutes les files d'attente nécessaires
      for (const [key, queueName] of Object.entries(this.queues)) {
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, this.exchange, key);
        console.log(`Queue: ${queueName} created and bound to exchange ${this.exchange} with key ${key}`);
      }

      // Gestionnaires d'événements
      this.connection.on('error', (err) => {
        console.error(`RabbitMQ connection error: ${err.message}`);
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.reconnect();
      });

      console.log('QueueService initialized successfully');
    } catch (error) {
      console.error(`Failed to initialize QueueService: ${error.message}`);
      // Tentative de reconnexion après un délai
      setTimeout(() => this.initialize(), 5000);
    }
  }

  /**
   * Tente de se reconnecter à RabbitMQ après une erreur
   * @private
   */
  async reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    try {
      console.log('Attempting to reconnect to RabbitMQ...');
      await this.close();
      await this.initialize();
      
      // Réabonner tous les consommateurs existants
      for (const [queue, callback] of this.consumers.entries()) {
        await this.consume(queue, callback);
      }

      this.reconnecting = false;
    } catch (error) {
      console.error(`Reconnection failed: ${error.message}`);
      this.reconnecting = false;
      // Réessayer après un délai
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  /**
   * Publie un message dans la file correspondante
   * @param {string} routingKey - Clé de routage (nom de la file)
   * @param {Object} data - Données à envoyer
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async publish(routingKey, data, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      const message = JSON.stringify(data);
      const publishOptions = {
        persistent: true, // Rend le message persistant
        ...options
      };

      const result = this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(message),
        publishOptions
      );

      if (result) {
        console.log(`Message published to ${routingKey}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      } else {
        console.warn(`Channel write buffer is full when publishing to ${routingKey}`);
      }

      return result;
    } catch (error) {
      console.error(`Error publishing message to ${routingKey}: ${error.message}`);
      return false;
    }
  }

  /**
   * Consomme les messages d'une file d'attente spécifique
   * @param {string} queueName - Nom de la file d'attente
   * @param {Function} callback - Fonction à exécuter pour chaque message
   * @returns {Promise<string>} Tag du consommateur
   */
  async consume(queueName, callback) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      // Créer la file si elle n'existe pas déjà
      await this.channel.assertQueue(queueName, { durable: true });

      // Enregistrer le callback pour une potentielle reconnexion
      this.consumers.set(queueName, callback);

      // Configurer le consommateur
      const { consumerTag } = await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          // Désérialiser le contenu du message
          const content = JSON.parse(msg.content.toString());
          console.log(`Processing message from ${queueName}: ${JSON.stringify(content).substring(0, 100)}${JSON.stringify(content).length > 100 ? '...' : ''}`);

          // Exécuter le callback avec le contenu du message
          await callback(content, msg);

          // Accuser réception du message seulement après traitement réussi
          this.channel.ack(msg);
        } catch (error) {
          console.error(`Error processing message from ${queueName}: ${error.message}`);
          
          // Si l'en-tête de redelivery est défini et dépasse un certain seuil
          // déplacer le message vers une file d'erreur plutôt que de le renvoyer
          if (msg.properties.headers && msg.properties.headers['x-delivery-count'] > 3) {
            this.channel.ack(msg);
            await this.publish('error', {
              originalQueue: queueName,
              content: JSON.parse(msg.content.toString()),
              error: error.message
            });
            console.log(`Message moved to error queue after multiple failed attempts`);
          } else {
            // Sinon, rejeter le message et le remettre dans la file
            const headers = msg.properties.headers || {};
            headers['x-delivery-count'] = (headers['x-delivery-count'] || 0) + 1;
            
            this.channel.nack(msg, false, true);
            console.log(`Message requeued for retry (attempt ${headers['x-delivery-count']})`);
          }
        }
      }, { noAck: false });

      console.log(`Consumer registered for queue ${queueName} with tag ${consumerTag}`);
      return consumerTag;
    } catch (error) {
      console.error(`Error setting up consumer for ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Soumet une tâche de notation à la file d'attente
   * @param {Object} assignmentData - Données de l'assignment à noter
   * @returns {Promise<string>} ID de la tâche
   */
  async submitGradingTask(assignmentData) {
    const taskId = `grading_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const task = {
      id: taskId,
      type: 'grading',
      data: assignmentData,
      timestamp: new Date().toISOString()
    };

    const success = await this.publish('grading', task);
    if (!success) {
      throw new Error('Failed to submit grading task');
    }

    return taskId;
  }

  /**
   * Soumet une tâche d'OCR à la file d'attente
   * @param {Object} imageData - Données de l'image à traiter
   * @returns {Promise<string>} ID de la tâche
   */
  async submitOCRTask(imageData) {
    const taskId = `ocr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const task = {
      id: taskId,
      type: 'ocr',
      data: imageData,
      timestamp: new Date().toISOString()
    };

    const success = await this.publish('ocr', task);
    if (!success) {
      throw new Error('Failed to submit OCR task');
    }

    return taskId;
  }

  /**
   * Soumet une tâche de génération de contenu à la file d'attente
   * @param {Object} contentData - Données pour la génération de contenu
   * @returns {Promise<string>} ID de la tâche
   */
  async submitContentGenerationTask(contentData) {
    const taskId = `content_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const task = {
      id: taskId,
      type: 'content_generation',
      data: contentData,
      timestamp: new Date().toISOString()
    };

    const success = await this.publish('content_generation', task);
    if (!success) {
      throw new Error('Failed to submit content generation task');
    }

    return taskId;
  }

  /**
   * Soumet une tâche d'analyse à la file d'attente
   * @param {Object} analyticsData - Données pour l'analyse
   * @returns {Promise<string>} ID de la tâche
   */
  async submitAnalyticsTask(analyticsData) {
    const taskId = `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const task = {
      id: taskId,
      type: 'analytics',
      data: analyticsData,
      timestamp: new Date().toISOString()
    };

    const success = await this.publish('analytics', task);
    if (!success) {
      throw new Error('Failed to submit analytics task');
    }

    return taskId;
  }

  /**
   * Ferme la connexion et le canal
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.channel = null;
      this.connection = null;
      console.log('QueueService closed');
    } catch (error) {
      console.error(`Error closing QueueService: ${error.message}`);
    }
  }
}

module.exports = QueueService;
