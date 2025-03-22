require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDatabase } = require('./config/database');
const { logger } = require('./utils/logger');

// Import des services
const CacheService = require('./services/CacheService');
const QueueService = require('./services/QueueService');
const SecurityService = require('./services/SecurityService');
const OCRService = require('./services/OCRService');
const LLMService = require('./services/LLMService');
const NotificationService = require('./services/NotificationService');
const EmailService = require('./services/EmailService');
const AnalyticsService = require('./services/AnalyticsService');
const CollaborationService = require('./services/CollaborationService');

// Initialisation des services
const cacheService = new CacheService();
const queueService = new QueueService();
const securityService = new SecurityService();
const ocrService = new OCRService({ cacheService });
const llmService = new LLMService({ cacheService });
const notificationService = new NotificationService({ cacheService });
const emailService = new EmailService();
const analyticsService = new AnalyticsService({ cacheService });
const collaborationService = new CollaborationService({ 
  notificationService, 
  cacheService, 
  userModel: require('mongoose').model('User') 
});

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Middleware pour la journalisation
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Injection des services dans les requêtes
app.use((req, res, next) => {
  req.services = {
    cache: cacheService,
    queue: queueService,
    security: securityService,
    ocr: ocrService,
    llm: llmService,
    notification: notificationService,
    email: emailService,
    analytics: analyticsService,
    collaboration: collaborationService
  };
  next();
});

// Dossier pour les fichiers téléchargés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware pour vérifier l'authentification
const authMiddleware = require('./middleware/auth');

// Définition des routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/assignments', authMiddleware, require('./routes/assignments'));
app.use('/api/submissions', authMiddleware, require('./routes/submissions'));
app.use('/api/rubrics', authMiddleware, require('./routes/rubrics'));
app.use('/api/ai', authMiddleware, require('./routes/ai'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/collaboration', authMiddleware, require('./routes/collaboration'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));

// Route par défaut
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Correcte-AI',
    version: '1.0.0',
    status: 'online'
  });
});

// Route de santé pour les vérifications de disponibilité
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      cache: cacheService ? 'available' : 'unavailable',
      queue: queueService ? 'available' : 'unavailable',
      security: securityService ? 'available' : 'unavailable',
      ocr: ocrService ? 'available' : 'unavailable',
      llm: llmService ? 'available' : 'unavailable',
      notification: notificationService ? 'available' : 'unavailable',
      email: emailService ? 'available' : 'unavailable',
      analytics: analyticsService ? 'available' : 'unavailable',
      collaboration: collaborationService ? 'available' : 'unavailable'
    }
  });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  logger.error(`Erreur serveur: ${err.message}`, { error: err });
  res.status(err.status || 500).json({ 
    message: 'Erreur serveur', 
    error: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message 
  });
});

// Démarrage de l'application
const startServer = async () => {
  try {
    // Connexion à la base de données MongoDB
    await connectDatabase();
    
    // Initialisation de la connexion à RabbitMQ
    await queueService.connect();
    
    // Démarrage du serveur HTTP
    app.listen(PORT, () => {
      logger.info(`Serveur en cours d'exécution sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur: ${error.message}`, { error });
    process.exit(1);
  }
};

// Gestion de l'arrêt propre
process.on('SIGTERM', async () => {
  logger.info('Signal SIGTERM reçu. Arrêt gracieux en cours...');
  await queueService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Signal SIGINT reçu. Arrêt gracieux en cours...');
  await queueService.close();
  process.exit(0);
});

// Démarrer le serveur
startServer();
