# Correcte-AI - Documentation Technique

## Vue d'ensemble

Correcte-AI est une application SaaS conçue pour aider les enseignants K-12 à noter automatiquement les travaux manuscrits des élèves. L'application utilise l'intelligence artificielle pour extraire le texte des images ou PDF de travaux manuscrits, puis note ces travaux selon des critères prédéfinis.

## Architecture

L'application suit une architecture client-serveur moderne :

### Frontend
- **Framework** : React avec Material UI
- **État** : Gestion d'état locale avec React Hooks
- **Routage** : React Router pour la navigation
- **Requêtes API** : Axios pour les appels HTTP

### Backend
- **Framework** : Node.js avec Express
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT (JSON Web Tokens)
- **Gestion de fichiers** : Multer pour le téléchargement de fichiers

### Services d'IA
- **OCR** : Service d'extraction de texte supportant Mistral OCR et Google Cloud Vision
- **LLM** : Service de génération de texte supportant OpenAI, Google Gemini, Anthropic et Deepseek

## Structure du projet

```
correcte-ai/
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services pour les appels API
│   │   └── App.jsx         # Composant racine
│   ├── tests/              # Tests frontend
│   └── Dockerfile          # Configuration Docker pour le frontend
│
├── backend/                # API Node.js/Express
│   ├── src/
│   │   ├── models/         # Modèles Mongoose
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services d'IA et utilitaires
│   │   ├── middleware/     # Middleware Express
│   │   └── server.js       # Point d'entrée du serveur
│   ├── tests/              # Tests backend
│   └── Dockerfile          # Configuration Docker pour le backend
│
├── docs/                   # Documentation
├── docker-compose.yml      # Configuration Docker Compose
└── README.md               # Documentation principale
```

## Modèles de données

### User
- `name` : Nom de l'utilisateur
- `email` : Email de l'utilisateur (unique)
- `password` : Mot de passe hashé
- `settings` : Préférences utilisateur et clés API

### Assignment
- `title` : Titre du devoir
- `description` : Description du devoir
- `type` : Type de devoir (homework, exam, rubric)
- `dueDate` : Date d'échéance
- `maxScore` : Score maximum
- `createdBy` : Référence à l'utilisateur créateur

### Submission
- `assignment` : Référence au devoir
- `student` : Informations sur l'étudiant
- `file` : Informations sur le fichier soumis
- `grade` : Résultat de la notation

### Rubric
- `title` : Titre de la rubrique
- `criteria` : Critères d'évaluation
- `createdBy` : Référence à l'utilisateur créateur

## API Endpoints

### Authentification
- `POST /api/auth/register` : Inscription d'un nouvel utilisateur
- `POST /api/auth/login` : Connexion d'un utilisateur
- `GET /api/auth/user` : Récupération des informations utilisateur

### Devoirs
- `GET /api/assignments` : Récupération de tous les devoirs
- `GET /api/assignments/:id` : Récupération d'un devoir spécifique
- `POST /api/assignments` : Création d'un nouveau devoir
- `PUT /api/assignments/:id` : Mise à jour d'un devoir
- `DELETE /api/assignments/:id` : Suppression d'un devoir

### Soumissions
- `POST /api/submissions/batch` : Téléchargement de plusieurs soumissions
- `GET /api/submissions/assignment/:assignmentId` : Récupération des soumissions pour un devoir
- `GET /api/submissions/export/:assignmentId` : Exportation des notes

### Services d'IA
- `POST /api/ai/ocr` : Extraction de texte à partir d'une image ou d'un PDF
- `POST /api/ai/grade` : Notation d'un travail
- `POST /api/ai/generate` : Génération de matériel pédagogique

## Services d'IA

### OCRService
Service pour l'extraction de texte à partir d'images ou de PDF.

**Fournisseurs supportés :**
- Mistral OCR
- Google Cloud Vision

**Méthodes principales :**
- `extractTextFromImage(filePath)` : Extrait le texte d'un fichier

### LLMService
Service pour la génération de texte, la notation et la création de matériel pédagogique.

**Fournisseurs supportés :**
- OpenAI
- Google Gemini
- Anthropic
- Deepseek

**Méthodes principales :**
- `generateText(prompt, options)` : Génère du texte à partir d'un prompt
- `gradeAssignment(studentWork, rubric, instructions)` : Note un travail d'élève
- `generateEducationalMaterial(type, title, instructions)` : Génère du matériel pédagogique

## Sécurité

- **Authentification** : JWT pour l'authentification des utilisateurs
- **Hachage de mots de passe** : bcrypt pour le hachage sécurisé des mots de passe
- **Validation des entrées** : Validation des données entrantes pour prévenir les injections
- **CORS** : Configuration CORS pour contrôler l'accès à l'API
- **Protection des routes** : Middleware d'authentification pour protéger les routes sensibles

## Tests

- **Tests unitaires** : Tests des composants individuels
- **Tests d'intégration** : Tests des interactions entre composants
- **Mocks** : Utilisation de mocks pour simuler les services externes

## Déploiement

L'application est conteneurisée avec Docker et peut être déployée avec Docker Compose.

**Conteneurs :**
- Frontend (Nginx + React)
- Backend (Node.js + Express)
- MongoDB

Voir le fichier `docs/deployment.md` pour les instructions détaillées de déploiement.

## Performances et mise à l'échelle

- **Mise en cache** : Configuration Nginx pour la mise en cache des ressources statiques
- **Compression** : Compression gzip pour réduire la taille des réponses
- **Base de données** : Indexation appropriée pour optimiser les requêtes MongoDB
- **Conteneurisation** : Architecture conteneurisée pour faciliter la mise à l'échelle horizontale

## Limitations connues et améliorations futures

- Intégration avec plus de systèmes LMS (Learning Management Systems)
- Support pour plus de formats de fichiers pour l'OCR
- Amélioration de la précision de l'OCR pour les écritures difficiles à lire
- Ajout de fonctionnalités de collaboration entre enseignants
- Implémentation d'un système de feedback pour améliorer les modèles d'IA