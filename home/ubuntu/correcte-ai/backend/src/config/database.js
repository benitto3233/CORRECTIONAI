const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Initialise la connexion à la base de données MongoDB
 * Gère la configuration, les reconnexions et les événements de base de données
 */
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/correcte-ai';
    
    // Options de connexion pour améliorer la robustesse et la performance
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout après 5s
      socketTimeoutMS: 45000, // Timeout des sockets après 45s
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connexion à MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB connecté: ${connection.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connecté à la base de données');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur de connexion Mongoose: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose déconnecté de la base de données');
    });
    
    // Gérer la fermeture propre lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Connexion à la base de données fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    });
    
    return connection;
  } catch (error) {
    logger.error(`Erreur lors de la connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
