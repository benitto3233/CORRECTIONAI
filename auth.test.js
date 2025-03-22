const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration pour les tests
beforeAll(async () => {
  // Connexion à la base de données de test
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/correcte-ai-test');
  
  // Nettoyer la base de données avant les tests
  await User.deleteMany({});
});

afterAll(async () => {
  // Fermer la connexion à la base de données après les tests
  await mongoose.connection.close();
});

describe('Tests des routes d\'authentification', () => {
  // Test d'inscription
  test('POST /api/auth/register - Inscription d\'un nouvel utilisateur', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user).not.toHaveProperty('password');
  });
  
  // Test de connexion
  test('POST /api/auth/login - Connexion d\'un utilisateur existant', async () => {
    // Créer un utilisateur pour le test
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await User.create({
      name: 'Login Test User',
      email: 'login@example.com',
      password: hashedPassword
    });
    
    const loginData = {
      email: 'login@example.com',
      password: 'password123'
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.name).toBe('Login Test User');
    expect(response.body.user.email).toBe(loginData.email);
    expect(response.body.user).not.toHaveProperty('password');
  });
  
  // Test de connexion avec des identifiants invalides
  test('POST /api/auth/login - Connexion avec des identifiants invalides', async () => {
    const loginData = {
      email: 'login@example.com',
      password: 'wrongpassword'
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('msg');
    expect(response.body.msg).toBe('Identifiants invalides');
  });
  
  // Test de récupération des informations utilisateur
  test('GET /api/auth/user - Récupération des informations utilisateur avec un token valide', async () => {
    // Créer un utilisateur pour le test
    const user = await User.create({
      name: 'Auth Test User',
      email: 'auth@example.com',
      password: await bcrypt.hash('password123', await bcrypt.genSalt(10))
    });
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'correcte-ai-secret-key',
      { expiresIn: '1h' }
    );
    
    const response = await request(app)
      .get('/api/auth/user')
      .set('x-auth-token', token);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('name', 'Auth Test User');
    expect(response.body).toHaveProperty('email', 'auth@example.com');
    expect(response.body).not.toHaveProperty('password');
  });
  
  // Test de récupération des informations utilisateur sans token
  test('GET /api/auth/user - Récupération des informations utilisateur sans token', async () => {
    const response = await request(app)
      .get('/api/auth/user');
    
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('msg', 'Aucun token, autorisation refusée');
  });
});
