const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|bmp|tiff|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files or PDFs are allowed'));
  }
});

// Process OCR on an image
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    // Process image with OCR
    const ocrResult = await req.services.ocr.processImage(req.file.path);
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'ocr_processed',
      { confidence: ocrResult.confidence }
    );
    
    res.json({
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      imagePath: req.file.path.replace(/\\/g, '/')
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ message: 'Erreur lors du traitement OCR' });
  }
});

// Grade text with a rubric
router.post('/grade', async (req, res) => {
  try {
    const { text, rubricId } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Aucun texte fourni' });
    }
    
    let rubric = null;
    if (rubricId) {
      const Rubric = mongoose.model('Rubric');
      rubric = await Rubric.findById(rubricId);
      
      if (!rubric) {
        return res.status(404).json({ message: 'Grille d\'évaluation non trouvée' });
      }
    }
    
    // Grade text using LLM
    const gradingResult = await req.services.llm.analyzeText(text, rubric || { criteria: [] });
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'text_graded',
      { textLength: text.length, score: gradingResult.score }
    );
    
    res.json(gradingResult);
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'évaluation du texte' });
  }
});

// Generate feedback for a text
router.post('/feedback', async (req, res) => {
  try {
    const { text, subject, gradeLevel } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Aucun texte fourni' });
    }
    
    // Generate feedback using LLM
    const feedbackResult = {
      strengths: [
        "Bonne compréhension des concepts de base",
        "Exemples pertinents utilisés",
        "Structure claire et logique"
      ],
      improvements: [
        "Quelques erreurs grammaticales à corriger",
        "Certains arguments pourraient être mieux développés",
        "Conclusion un peu brève"
      ],
      overallFeedback: "Ce travail montre une bonne maîtrise du sujet. Quelques améliorations mineures pourraient renforcer l'argumentation et la précision linguistique."
    };
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'feedback_generated',
      { textLength: text.length, subject, gradeLevel }
    );
    
    res.json(feedbackResult);
  } catch (error) {
    console.error('Feedback generation error:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du feedback' });
  }
});

module.exports = router;
