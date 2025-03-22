require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const { CacheService, QueueService } = require('./services/simplified-services');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Simple logger
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug
};

// Connect to MongoDB
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://correcte-ai-demo:RW5Kju8SwpKWVzBj@cluster0.mongodb.net/correcte-ai-demo?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB!');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Initialize services
const cacheService = new CacheService();
const queueService = new QueueService();

// Security service (simplified)
class SecurityService {
  hashPassword(password) {
    return require('bcryptjs').hashSync(password, 10);
  }
  
  comparePassword(password, hash) {
    return require('bcryptjs').compareSync(password, hash);
  }
  
  generateToken(payload) {
    return require('jsonwebtoken').sign(payload, process.env.JWT_SECRET || 'correcte-ai-secret', { expiresIn: '1d' });
  }
  
  verifyToken(token) {
    return require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'correcte-ai-secret');
  }
}

// Load models
require('./models/User');
require('./models/Assignment');
require('./models/Submission');
require('./models/Rubric');
require('./models/Notification');
require('./models/CollaborationSpace');

// Simplified service implementations
class OCRService {
  constructor() {
    this.cacheService = cacheService;
    logger.info('OCR Service initialized');
  }
  
  async processImage(imagePath) {
    // Simulate OCR processing
    return {
      text: "This is simulated OCR text from the image. In a production environment, this would be the actual text extracted from the image using OCR technology.",
      confidence: 0.92
    };
  }
}

class LLMService {
  constructor() {
    this.cacheService = cacheService;
    logger.info('LLM Service initialized');
  }
  
  async analyzeText(text, rubric) {
    // Simulate LLM analysis
    return {
      analysis: "This is a simulated LLM analysis of the text based on the provided rubric.",
      score: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
      feedback: "This is automated feedback generated for the submission. It includes strengths and areas for improvement.",
      criteriaScores: rubric.criteria.map(c => ({
        criteriaId: c._id || c.id,
        score: Math.floor(Math.random() * (c.maxPoints || 10)),
        feedback: `Feedback for ${c.name}: Good work on this criteria.`
      }))
    };
  }
}

class NotificationService {
  constructor() {
    this.cacheService = cacheService;
    logger.info('Notification Service initialized');
  }
  
  async createNotification(userId, type, content) {
    const Notification = mongoose.model('Notification');
    const notification = new Notification({
      user: userId,
      type,
      content,
      isRead: false,
      createdAt: new Date()
    });
    await notification.save();
    return notification;
  }
  
  async getUserNotifications(userId) {
    const Notification = mongoose.model('Notification');
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
  }
}

class EmailService {
  async sendEmail(to, subject, body) {
    logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return true;
  }
}

class AnalyticsService {
  constructor() {
    this.cacheService = cacheService;
    logger.info('Analytics Service initialized');
  }
  
  async trackEvent(userId, eventType, eventData) {
    logger.info(`[ANALYTICS] User: ${userId}, Event: ${eventType}`);
    return true;
  }
  
  async getUserMetrics(userId) {
    // Simulate analytics data
    return {
      assignmentsCreated: Math.floor(Math.random() * 20) + 5,
      submissionsGraded: Math.floor(Math.random() * 100) + 50,
      averageScore: Math.floor(Math.random() * 15) + 75,
      timeSpent: Math.floor(Math.random() * 50) + 10,
      recentActivity: [
        { type: 'assignment_created', timestamp: new Date() },
        { type: 'submission_graded', timestamp: new Date(Date.now() - 86400000) }
      ]
    };
  }
  
  async getSystemMetrics() {
    return {
      activeUsers: Math.floor(Math.random() * 150) + 50,
      totalAssignments: Math.floor(Math.random() * 500) + 1000,
      totalSubmissions: Math.floor(Math.random() * 2000) + 5000,
      processingErrors: Math.floor(Math.random() * 10) + 5,
      averageProcessingTime: (Math.random() * 5 + 3).toFixed(1),
      systemLoad: Math.floor(Math.random() * 40) + 20,
      storageUsed: Math.floor(Math.random() * 30) + 40,
      newUsersThisWeek: Math.floor(Math.random() * 20) + 10
    };
  }
}

class CollaborationService {
  constructor() {
    this.notificationService = new NotificationService();
    this.userModel = mongoose.model('User');
    this.collaborationSpaceModel = mongoose.model('CollaborationSpace');
    logger.info('Collaboration Service initialized');
  }
  
  async createCollaborationSpace(creatorId, spaceData) {
    const newSpace = new this.collaborationSpaceModel({
      ...spaceData,
      creator: creatorId,
      members: [{ user: creatorId, role: 'admin' }],
      isActive: true
    });
    await newSpace.save();
    return newSpace;
  }
  
  async getUserCollaborationSpaces(userId) {
    return this.collaborationSpaceModel.find({
      'members.user': userId
    }).populate('members.user', 'name email');
  }
  
  async addMember(spaceId, userId, role = 'contributor') {
    const space = await this.collaborationSpaceModel.findById(spaceId);
    if (!space) {
      throw new Error('Collaboration space not found');
    }
    
    // Check if user is already a member
    const isMember = space.members.some(m => m.user.toString() === userId.toString());
    if (isMember) {
      throw new Error('User is already a member of this space');
    }
    
    space.members.push({ user: userId, role });
    await space.save();
    
    // Notify the user
    await this.notificationService.createNotification(
      userId,
      'collaboration_invite',
      `You have been added to the collaboration space: ${space.name}`
    );
    
    return space;
  }
}

// Initialize service instances
const securityService = new SecurityService();
const ocrService = new OCRService();
const llmService = new LLMService();
const notificationService = new NotificationService();
const emailService = new EmailService();
const analyticsService = new AnalyticsService();
const collaborationService = new CollaborationService();

// Middleware for logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Injection of services into requests
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

// Static files directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    
    const decoded = securityService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/assignments', authMiddleware, require('./routes/assignments'));
app.use('/api/submissions', authMiddleware, require('./routes/submissions'));
app.use('/api/rubrics', authMiddleware, require('./routes/rubrics'));
app.use('/api/ai', authMiddleware, require('./routes/ai'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/collaboration', authMiddleware, require('./routes/collaboration'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Correcte-AI',
    version: '1.0.0',
    status: 'online'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      cache: 'available',
      queue: 'available',
      security: 'available',
      ocr: 'available',
      llm: 'available',
      notification: 'available',
      email: 'available',
      analytics: 'available',
      collaboration: 'available'
    }
  });
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`, { error: err });
  res.status(err.status || 500).json({ 
    message: 'Erreur serveur', 
    error: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message 
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Initialize queue connection
    await queueService.connect();
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`, { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Graceful shutdown in progress...');
  await queueService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Graceful shutdown in progress...');
  await queueService.close();
  process.exit(0);
});

// Start the server
startServer();
