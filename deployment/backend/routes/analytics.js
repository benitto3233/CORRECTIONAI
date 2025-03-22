const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get user analytics data
router.get('/user', async (req, res) => {
  try {
    const userMetrics = await req.services.analytics.getUserMetrics(req.user.id);
    res.json(userMetrics);
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des analytics utilisateur' });
  }
});

// Get system analytics data (admin only)
router.get('/system', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const systemMetrics = await req.services.analytics.getSystemMetrics();
    res.json(systemMetrics);
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des analytics système' });
  }
});

// Get assignment analytics
router.get('/assignment/:id', async (req, res) => {
  try {
    const Assignment = mongoose.model('Assignment');
    const Submission = mongoose.model('Submission');
    
    // Check if assignment exists and user has access
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Devoir non trouvé' });
    }
    
    // If not admin, check if user is the creator
    if (req.user.role !== 'admin' && assignment.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Get submissions for this assignment
    const submissions = await Submission.find({ assignment: req.params.id });
    
    // Calculate analytics
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.status === 'graded').length;
    const pendingSubmissions = submissions.filter(s => ['pending', 'processing'].includes(s.status)).length;
    const errorSubmissions = submissions.filter(s => s.status === 'error').length;
    
    // Calculate average score
    let totalScore = 0;
    let scoredSubmissions = 0;
    
    submissions.forEach(submission => {
      if (submission.grade && submission.grade.score !== undefined) {
        totalScore += submission.grade.score;
        scoredSubmissions++;
      }
    });
    
    const averageScore = scoredSubmissions > 0 ? Math.round(totalScore / scoredSubmissions * 10) / 10 : 0;
    
    // Calculate processing time analytics
    const processingTimes = submissions
      .filter(s => s.analytics && s.analytics.processingTime)
      .map(s => s.analytics.processingTime);
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;
    
    res.json({
      assignmentId: req.params.id,
      totalSubmissions,
      gradedSubmissions,
      pendingSubmissions,
      errorSubmissions,
      averageScore,
      processingAnalytics: {
        averageProcessingTime: avgProcessingTime.toFixed(2),
        totalProcessed: gradedSubmissions,
        pending: pendingSubmissions
      },
      submissionDistribution: {
        graded: gradedSubmissions,
        pending: pendingSubmissions,
        error: errorSubmissions
      }
    });
  } catch (error) {
    console.error('Get assignment analytics error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des analytics du devoir' });
  }
});

module.exports = router;
