const express = require('express');
const router = express.Router();
const { authorize, authorizeRoles } = require('../middleware/auth');
const AnalyticsService = require('../services/AnalyticsService');
const CacheService = require('../services/CacheService');

// Initialize services
const cacheService = new CacheService();
const analyticsService = new AnalyticsService({ cacheService });

/**
 * @route   GET /api/analytics/system
 * @desc    Get system-wide metrics
 * @access  Private (Admin only)
 */
router.get('/system', authorize(), authorizeRoles(['admin']), async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    const metrics = await analyticsService.getSystemMetrics(period);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des mu00e9triques systu00e8me' });
  }
});

/**
 * @route   GET /api/analytics/user
 * @desc    Get metrics for current user
 * @access  Private
 */
router.get('/user', authorize(), async (req, res) => {
  try {
    const metrics = await analyticsService.getUserMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des mu00e9triques utilisateur' });
  }
});

/**
 * @route   GET /api/analytics/user/:id
 * @desc    Get metrics for a specific user (admins only)
 * @access  Private (Admin only)
 */
router.get('/user/:id', authorize(), authorizeRoles(['admin']), async (req, res) => {
  try {
    const metrics = await analyticsService.getUserMetrics(req.params.id);
    res.json(metrics);
  } catch (error) {
    console.error(`Error fetching metrics for user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des mu00e9triques utilisateur' });
  }
});

/**
 * @route   GET /api/analytics/cohort
 * @desc    Get cohort retention analysis
 * @access  Private (Admin only)
 */
router.get('/cohort', authorize(), authorizeRoles(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, interval, userType } = req.query;
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      interval,
      userType
    };
    
    const cohortData = await analyticsService.getCohortRetention(options);
    res.json(cohortData);
  } catch (error) {
    console.error('Error fetching cohort analytics:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration des analyses de cohorte' });
  }
});

/**
 * @route   GET /api/analytics/nps
 * @desc    Get NPS (Net Promoter Score) report
 * @access  Private (Admin only)
 */
router.get('/nps', authorize(), authorizeRoles(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, userSegment } = req.query;
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userSegment
    };
    
    const npsReport = await analyticsService.getNPSReport(options);
    res.json(npsReport);
  } catch (error) {
    console.error('Error fetching NPS report:', error);
    res.status(500).json({ message: 'Erreur lors de la ru00e9cupu00e9ration du rapport NPS' });
  }
});

/**
 * @route   GET /api/analytics/recommendations
 * @desc    Get personalized recommendations for the current user
 * @access  Private
 */
router.get('/recommendations', authorize(), async (req, res) => {
  try {
    const recommendations = await analyticsService.generateUserRecommendations(req.user.id);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Erreur lors de la gu00e9nu00e9ration des recommandations' });
  }
});

/**
 * @route   GET /api/analytics/workload
 * @desc    Get workload prediction for the current user
 * @access  Private
 */
router.get('/workload', authorize(), async (req, res) => {
  try {
    const { days } = req.query;
    const prediction = await analyticsService.predictWorkload(
      req.user.id, 
      days ? parseInt(days) : 7
    );
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting workload:', error);
    res.status(500).json({ message: 'Erreur lors de la pru00e9diction de la charge de travail' });
  }
});

module.exports = router;
