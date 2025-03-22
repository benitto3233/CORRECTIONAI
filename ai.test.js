const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Configuration pour les tests
let testUser;
let authToken;

beforeAll(async () => {
  // Connexion à la base de données de test
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/correcte-ai-test');
  
  // Créer un utilisateur de test avec des clés API
  testUser = await User.create({
    name: 'AI Test User',
    email: 'ai@example.com',
    password: 'hashedpassword',
    settings: {
      preferredModel: 'openai',
      apiKeys: [
        { provider: 'openai', key: 'sk-test-key', active: true },
        { provider: 'mistral', key: 'test-mistral-key', active: true }
      ]
    }
  });
  
  authToken = jwt.sign(
    { id: testUser.id },
    process.env.JWT_SECRET || 'correcte-ai-secret-key',
    { expiresIn: '1h' }
  );
  
  // Créer le répertoire pour les fichiers de test
  const testUploadDir = path.join(__dirname, '../uploads/test');
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }
});

afterAll(async () => {
  // Fermer la connexion à la base de données après les tests
  await mongoose.connection.close();
});

// Mock des services d'IA pour les tests
jest.mock('../src/services/OCRService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      extractTextFromImage: jest.fn().mockResolvedValue('Texte extrait du document de test')
    };
  });
});

jest.mock('../src/services/LLMService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      gradeAssignment: jest.fn().mockResolvedValue({
        score: 85,
        feedback: "Bon travail dans l'ensemble.",
        criteriaEvaluations: [
          { criteriaName: "Compréhension", score: 9, feedback: "Excellente compréhension des concepts" },
          { criteriaName: "Organisation", score: 8, feedback: "Bonne organisation, mais pourrait être plus structuré" }
        ],
        improvementSuggestions: ["Développer davantage les exemples", "Ajouter plus de références"]
      }),
      generateEducationalMaterial: jest.fn().mockResolvedValue({
        title: "Test Material",
        introduction: "Introduction au sujet de test",
        questions: [
          { questionNumber: 1, questionText: "Question de test", instructions: "Instructions", pointsValue: 10 }
        ]
      })
    };
  });
});

describe('Tests des routes d\'IA', () => {
  // Test d'OCR
  test('POST /api/ai/ocr - Extraction de texte à partir d\'une image', async () => {
    // Créer un fichier de test
    const testFilePath = path.join(__dirname, '../uploads/test/test-image.jpg');
    fs.writeFileSync(testFilePath, 'test image content');
    
    const response = await request(app)
      .post('/api/ai/ocr')
      .set('x-auth-token', authToken)
      .attach('file', testFilePath);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('text');
    expect(response.body).toHaveProperty('file');
    
    // Nettoyer le fichier de test
    fs.unlinkSync(testFilePath);
  });
  
  // Test de notation
  test('POST /api/ai/grade - Notation d\'un travail', async () => {
    const gradeData = {
      text: "Ceci est un exemple de travail d'élève à noter.",
      rubric: "Critères de notation: Compréhension (10 points), Organisation (10 points)",
      instructions: "Notation stricte"
    };
    
    const response = await request(app)
      .post('/api/ai/grade')
      .set('x-auth-token', authToken)
      .send(gradeData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('feedback');
    expect(response.body).toHaveProperty('rubricScores');
    expect(Array.isArray(response.body.rubricScores)).toBe(true);
  });
  
  // Test de génération de matériel
  test('POST /api/ai/generate - Génération de matériel pédagogique', async () => {
    const generateData = {
      type: 'homework',
      title: 'Devoir de mathématiques',
      instructions: 'Niveau collège, algèbre'
    };
    
    const response = await request(app)
      .post('/api/ai/generate')
      .set('x-auth-token', authToken)
      .send(generateData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('material');
    expect(response.body.material).toHaveProperty('title');
  });
});
