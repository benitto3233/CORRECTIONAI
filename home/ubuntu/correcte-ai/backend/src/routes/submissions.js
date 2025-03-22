const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/submissions');
    
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

// @route   POST api/submissions/batch
// @desc    Télécharger plusieurs soumissions d'élèves
// @access  Private
router.post('/batch', auth, upload.array('files', 50), async (req, res) => {
  try {
    const { assignmentId, studentData } = req.body;
    
    // Vérifier si le devoir existe
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à ajouter des soumissions à ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    // Vérifier si des fichiers ont été téléchargés
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'Aucun fichier téléchargé' });
    }
    
    // Traiter les données des étudiants si fournies
    let parsedStudentData = [];
    if (studentData) {
      try {
        parsedStudentData = JSON.parse(studentData);
      } catch (err) {
        return res.status(400).json({ msg: 'Format de données étudiant invalide' });
      }
    }
    
    // Créer les soumissions
    const submissions = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const student = parsedStudentData[i] || { name: `Étudiant ${i+1}`, id: `ID-${i+1}` };
      
      const newSubmission = new Submission({
        assignment: assignmentId,
        student: {
          name: student.name,
          id: student.id
        },
        file: {
          originalName: file.originalname,
          fileName: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }
      });
      
      await newSubmission.save();
      submissions.push(newSubmission);
    }
    
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/submissions/assignment/:assignmentId
// @desc    Obtenir toutes les soumissions pour un devoir spécifique
// @access  Private
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir les soumissions de ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/submissions/export/:assignmentId
// @desc    Exporter les notes pour un devoir spécifique
// @access  Private
router.get('/export/:assignmentId', auth, async (req, res) => {
  try {
    const { format } = req.query;
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Devoir non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à exporter les notes de ce devoir
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    const submissions = await Submission.find({ 
      assignment: req.params.assignmentId,
      'grade.score': { $exists: true }
    });
    
    // Format par défaut: CSV
    const exportFormat = format || 'csv';
    
    if (exportFormat === 'csv') {
      // Générer le CSV
      let csv = 'Student ID,Student Name,Score,Feedback\n';
      
      submissions.forEach(submission => {
        const studentId = submission.student.id.replace(/,/g, ' ');
        const studentName = submission.student.name.replace(/,/g, ' ');
        const score = submission.grade.score;
        const feedback = submission.grade.feedback ? submission.grade.feedback.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
        
        csv += `${studentId},${studentName},${score},"${feedback}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=grades-${req.params.assignmentId}.csv`);
      return res.send(csv);
    } else if (exportFormat === 'json') {
      // Renvoyer en JSON
      return res.json(submissions.map(submission => ({
        studentId: submission.student.id,
        studentName: submission.student.name,
        score: submission.grade.score,
        feedback: submission.grade.feedback,
        rubricScores: submission.grade.rubricScores
      })));
    } else {
      return res.status(400).json({ msg: 'Format d\'exportation non pris en charge' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
