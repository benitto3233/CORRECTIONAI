const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = mongoose.model('Submission');
const Assignment = mongoose.model('Assignment');

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

// Get all submissions for current user
router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find({ submittedBy: req.user.id })
      .populate('assignment', 'title')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des soumissions' });
  }
});

// Create a new submission with image upload
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { assignmentId, studentName, studentId } = req.body;
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // Create submission object
    const newSubmission = new Submission({
      assignment: assignmentId,
      student: {
        name: studentName,
        id: studentId
      },
      submittedBy: req.user.id,
      images: req.files.map(file => ({
        path: file.path.replace(/\\/g, '/'),
        processedText: '',
        ocrConfidence: 0
      })),
      status: 'pending'
    });
    
    await newSubmission.save();
    
    // Update assignment submission count
    assignment.submissionsCount += 1;
    await assignment.save();
    
    // Enqueue submission for processing
    await req.services.queue.sendToQueue('submission-processing', {
      submissionId: newSubmission._id,
      assignmentId: assignmentId
    });
    
    // Process submission immediately for demo purposes
    setTimeout(async () => {
      try {
        const submission = await Submission.findById(newSubmission._id);
        if (!submission) return;
        
        // Update submission with OCR results
        submission.status = 'processing';
        submission.images = submission.images.map(img => ({
          ...img,
          processedText: "This is simulated OCR text for the uploaded image. In production, this would be the actual extracted text.",
          ocrConfidence: 0.92
        }));
        await submission.save();
        
        // Get rubric information
        const populatedAssignment = await Assignment.findById(assignmentId).populate('rubric');
        const rubric = populatedAssignment.rubric;
        
        // Simulate LLM analysis
        const analysisResult = await req.services.llm.analyzeText(
          "This is simulated OCR text for grading", 
          rubric || { criteria: [] }
        );
        
        // Update with grading results
        submission.status = 'graded';
        submission.grade = {
          score: analysisResult.score,
          maxScore: 100,
          feedback: analysisResult.feedback,
          criteriaScores: analysisResult.criteriaScores,
          gradedBy: 'ai',
          gradedAt: new Date(),
          aiGrade: {
            score: analysisResult.score,
            feedback: analysisResult.feedback
          }
        };
        submission.analytics = {
          processingTime: Math.floor(Math.random() * 15) + 5  // 5-20 seconds
        };
        await submission.save();
        
        // Create notification for the teacher
        await req.services.notification.createNotification(
          req.user.id,
          'submission_graded',
          `La soumission de ${studentName} a été notée.`
        );
        
      } catch (error) {
        console.error('Error in submission processing:', error);
      }
    }, 5000);
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'submission_created',
      { submissionId: newSubmission._id, assignmentId }
    );
    
    res.status(201).json({
      message: 'Soumission créée avec succès, traitement en cours...',
      submission: newSubmission
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la soumission' });
  }
});

// Get a specific submission
router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment');
    
    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }
    
    // Check if user has access to this submission
    if (submission.submittedBy.toString() !== req.user.id && 
        submission.assignment.creator.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la soumission' });
  }
});

// Update submission grade (teacher override)
router.put('/:id/grade', async (req, res) => {
  try {
    const { score, feedback, criteriaScores } = req.body;
    
    const submission = await Submission.findById(req.params.id)
      .populate({
        path: 'assignment',
        populate: { path: 'creator' }
      });
    
    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }
    
    // Check if user is the assignment creator
    if (submission.assignment.creator._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Update grade information
    submission.grade.score = score;
    submission.grade.feedback = feedback;
    if (criteriaScores) {
      submission.grade.criteriaScores = criteriaScores;
    }
    submission.grade.gradedBy = submission.grade.aiGrade ? 'both' : 'teacher';
    submission.grade.teacherGrade = {
      score,
      feedback
    };
    
    // Calculate review time if it was previously AI-graded
    if (submission.grade.gradedBy === 'both' && submission.grade.gradedAt) {
      const reviewTime = (new Date() - new Date(submission.grade.gradedAt)) / 1000; // in seconds
      submission.analytics = submission.analytics || {};
      submission.analytics.reviewTime = reviewTime;
    }
    
    await submission.save();
    
    // Track analytics event
    await req.services.analytics.trackEvent(
      req.user.id,
      'submission_teacher_graded',
      { submissionId: submission._id }
    );
    
    res.json({
      message: 'Note mise à jour avec succès',
      submission
    });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la note' });
  }
});

// Delete a submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }
    
    // Check if user is the submitter or the assignment creator
    const assignment = await Assignment.findById(submission.assignment);
    if (submission.submittedBy.toString() !== req.user.id && 
        assignment.creator.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Delete associated images
    submission.images.forEach(image => {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
    });
    
    await Submission.findByIdAndDelete(req.params.id);
    
    // Update assignment submission count
    if (assignment) {
      assignment.submissionsCount = Math.max(0, assignment.submissionsCount - 1);
      await assignment.save();
    }
    
    res.json({ message: 'Soumission supprimée avec succès' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la soumission' });
  }
});

module.exports = router;
