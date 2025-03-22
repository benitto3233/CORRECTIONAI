const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const Assignment = require('../src/models/Assignment');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

// Configuration pour les tests
let testUser;
let authToken;

beforeAll(async () => {
  // Connexion à la base de données de test
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/correcte-ai-test');
  
  // Nettoyer la base de données avant les tests
  await Assignment.deleteMany({});
  
  // Créer un utilisateur de test et générer un token
  testUser = await User.create({
    name: 'Assignment Test User',
    email: 'assignment@example.com',
    password: 'hashedpassword'
  });
  
  authToken = jwt.sign(
    { id: testUser.id },
    process.env.JWT_SECRET || 'correcte-ai-secret-key',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  // Fermer la connexion à la base de données après les tests
  await mongoose.connection.close();
});

describe('Tests des routes de devoirs', () => {
  // Test de création d'un devoir
  test('POST /api/assignments - Création d\'un nouveau devoir', async () => {
    const assignmentData = {
      title: 'Test Assignment',
      description: 'This is a test assignment',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Une semaine dans le futur
      type: 'homework',
      maxScore: 100
    };
    
    const response = await request(app)
      .post('/api/assignments')
      .set('x-auth-token', authToken)
      .send(assignmentData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('title', assignmentData.title);
    expect(response.body).toHaveProperty('description', assignmentData.description);
    expect(response.body).toHaveProperty('createdBy', testUser.id);
  });
  
  // Test de récupération de tous les devoirs
  test('GET /api/assignments - Récupération de tous les devoirs', async () => {
    // Créer quelques devoirs supplémentaires pour le test
    await Assignment.create([
      {
        title: 'Assignment 1',
        description: 'Description 1',
        dueDate: new Date(),
        type: 'homework',
        maxScore: 100,
        createdBy: testUser.id
      },
      {
        title: 'Assignment 2',
        description: 'Description 2',
        dueDate: new Date(),
        type: 'exam',
        maxScore: 50,
        createdBy: testUser.id
      }
    ]);
    
    const response = await request(app)
      .get('/api/assignments')
      .set('x-auth-token', authToken);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(3); // Au moins les 3 devoirs créés
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('description');
    expect(response.body[0]).toHaveProperty('createdBy');
  });
  
  // Test de récupération d'un devoir spécifique
  test('GET /api/assignments/:id - Récupération d\'un devoir spécifique', async () => {
    // Créer un devoir pour le test
    const assignment = await Assignment.create({
      title: 'Specific Assignment',
      description: 'Specific Description',
      dueDate: new Date(),
      type: 'homework',
      maxScore: 100,
      createdBy: testUser.id
    });
    
    const response = await request(app)
      .get(`/api/assignments/${assignment.id}`)
      .set('x-auth-token', authToken);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id', assignment.id);
    expect(response.body).toHaveProperty('title', 'Specific Assignment');
    expect(response.body).toHaveProperty('description', 'Specific Description');
  });
  
  // Test de mise à jour d'un devoir
  test('PUT /api/assignments/:id - Mise à jour d\'un devoir', async () => {
    // Créer un devoir pour le test
    const assignment = await Assignment.create({
      title: 'Assignment to Update',
      description: 'Original Description',
      dueDate: new Date(),
      type: 'homework',
      maxScore: 100,
      createdBy: testUser.id
    });
    
    const updateData = {
      title: 'Updated Assignment',
      description: 'Updated Description'
    };
    
    const response = await request(app)
      .put(`/api/assignments/${assignment.id}`)
      .set('x-auth-token', authToken)
      .send(updateData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id', assignment.id);
    expect(response.body).toHaveProperty('title', updateData.title);
    expect(response.body).toHaveProperty('description', updateData.description);
  });
  
  // Test de suppression d'un devoir
  test('DELETE /api/assignments/:id - Suppression d\'un devoir', async () => {
    // Créer un devoir pour le test
    const assignment = await Assignment.create({
      title: 'Assignment to Delete',
      description: 'Will be deleted',
      dueDate: new Date(),
      type: 'homework',
      maxScore: 100,
      createdBy: testUser.id
    });
    
    const response = await request(app)
      .delete(`/api/assignments/${assignment.id}`)
      .set('x-auth-token', authToken);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Devoir supprimé');
    
    // Vérifier que le devoir a bien été supprimé
    const deletedAssignment = await Assignment.findById(assignment.id);
    expect(deletedAssignment).toBeNull();
  });
});
