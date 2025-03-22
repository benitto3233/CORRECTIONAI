const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const OCRService = require('../services/OCRService');
const LLMService = require('../services/LLMService');
const User = require('../models/User');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ai');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images et les PDF
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers images et PDF sont autorisés'));
  }
});

// Fonction utilitaire pour obtenir les clés API de l'utilisateur
const getUserApiKeys = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.settings || !user.settings.apiKeys) {
      return null;
    }
    return user.settings.apiKeys;
  } catch (error) {
    console.error('Erreur lors de la récupération des clés API:', error);
    return null;
  }
};

// @route   POST api/ai/ocr
// @desc    Extraire le texte d'une image ou d'un PDF
// @access  Private
router.post('/ocr', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Aucun fichier fourni' });
    }

    // Récupérer les clés API de l'utilisateur
    const apiKeys = await getUserApiKeys(req.user.id);
    
    if (!apiKeys) {
      return res.status(400).json({ msg: 'Aucune clé API configurée' });
    }
    
    // Déterminer le fournisseur OCR à utiliser
    let ocrProvider = 'mistral';
    let apiKey = apiKeys.find(key => key.provider === 'mistral' && key.active)?.key;
    
    if (!apiKey) {
      // Essayer Google Vision comme alternative
      apiKey = apiKeys.find(key => key.provider === 'google' && key.active)?.key;
      if (apiKey) {
        ocrProvider = 'google';
      } else {
        return res.status(400).json({ msg: 'Aucune clé API OCR active trouvée' });
      }
    }
    
    // Créer une instance du service OCR
    const ocrService = new OCRService(apiKey, ocrProvider);
    
    // Extraire le texte du fichier
    const extractedText = await ocrService.extractTextFromImage(req.file.path);
    
    // Renvoyer le texte extrait
    res.json({
      success: true,
      text: extractedText,
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        path: req.file.path
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/ai/grade
// @desc    Noter un travail avec l'IA
// @access  Private
router.post('/grade', auth, async (req, res) => {
  try {
    const { text, rubric, instructions } = req.body;
    
    if (!text) {
      return res.status(400).json({ msg: 'Texte à noter requis' });
    }
    
    // Récupérer les clés API de l'utilisateur
    const apiKeys = await getUserApiKeys(req.user.id);
    
    if (!apiKeys) {
      return res.status(400).json({ msg: 'Aucune clé API configurée' });
    }
    
    // Récupérer les préférences de l'utilisateur
    const user = await User.findById(req.user.id);
    const preferredModel = user.settings?.preferredModel || 'openai';
    
    // Trouver la clé API active pour le modèle préféré
    let apiKey = apiKeys.find(key => key.provider === preferredModel && key.active)?.key;
    let llmProvider = preferredModel;
    
    // Si aucune clé n'est trouvée pour le modèle préféré, utiliser la première clé active disponible
    if (!apiKey) {
      const activeKey = apiKeys.find(key => key.active);
      if (activeKey) {
        apiKey = activeKey.key;
        llmProvider = activeKey.provider;
      } else {
        return res.status(400).json({ msg: 'Aucune clé API LLM active trouvée' });
      }
    }
    
    // Créer une instance du service LLM
    const llmService = new LLMService(apiKey, llmProvider);
    
    // Noter le travail
    const gradingResult = await llmService.gradeAssignment(text, rubric, instructions);
    
    // Renvoyer le résultat de la notation
    res.json({
      success: true,
      score: gradingResult.score,
      feedback: gradingResult.feedback,
      rubricScores: gradingResult.criteriaEvaluations.map(criteria => ({
        criteriaId: criteria.criteriaName,
        score: criteria.score,
        feedback: criteria.feedback
      })),
      improvementSuggestions: gradingResult.improvementSuggestions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/ai/generate
// @desc    Générer du matériel pédagogique avec l'IA
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { type, title, instructions } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({ msg: 'Type et titre requis' });
    }
    
    // Récupérer les clés API de l'utilisateur
    const apiKeys = await getUserApiKeys(req.user.id);
    
    if (!apiKeys) {
      return res.status(400).json({ msg: 'Aucune clé API configurée' });
    }
    
    // Récupérer les préférences de l'utilisateur
    const user = await User.findById(req.user.id);
    const preferredModel = user.settings?.preferredModel || 'openai';
    
    // Trouver la clé API active pour le modèle préféré
    let apiKey = apiKeys.find(key => key.provider === preferredModel && key.active)?.key;
    let llmProvider = preferredModel;
    
    // Si aucune clé n'est trouvée pour le modèle préféré, utiliser la première clé active disponible
    if (!apiKey) {
      const activeKey = apiKeys.find(key => key.active);
      if (activeKey) {
        apiKey = activeKey.key;
        llmProvider = activeKey.provider;
      } else {
        return res.status(400).json({ msg: 'Aucune clé API LLM active trouvée' });
      }
    }
    
    // Créer une instance du service LLM
    const llmService = new LLMService(apiKey, llmProvider);
    
    // Générer le matériel pédagogique
    const generatedMaterial = await llmService.generateEducationalMaterial(type, title, instructions);
    
    // Renvoyer le matériel généré
    res.json({
      success: true,
      material: generatedMaterial
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
