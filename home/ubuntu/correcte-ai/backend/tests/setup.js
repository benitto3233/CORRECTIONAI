// Configuration pour les tests
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: '.env.test' });

// Augmenter le timeout pour les tests qui impliquent des requêtes API
jest.setTimeout(10000);

// Mock des services externes
jest.mock('../src/services/OCRService');
jest.mock('../src/services/LLMService');

// Fonction pour se connecter à la base de données de test
beforeAll(async () => {
  // Utiliser une base de données de test séparée
  const mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/correcte-ai-test';
  
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Fonction pour fermer la connexion à la base de données après tous les tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Nettoyage des mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
