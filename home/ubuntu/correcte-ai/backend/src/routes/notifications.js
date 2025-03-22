const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authorize } = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');

// Import models
const Notification = mongoose.model('Notification');

// Initialize services
const notificationService = new NotificationService();

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', authorize(), async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    };
    
    const notifications = await notificationService.getUserNotifications(req.user.id, options);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
});

/**
 * @route   GET /api/notifications/count
 * @desc    Get count of unread notifications for the current user
 * @access  Private
 */
router.get('/count', authorize(), async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre de notifications' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', authorize(), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    // Vérifier que la notification appartient à l'utilisateur
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette notification' });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Erreur lors du marquage de la notification comme lue' });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authorize(), async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Erreur lors du marquage des notifications comme lues' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', authorize(), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    // Vérifier que la notification appartient à l'utilisateur
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette notification' });
    }
    
    await notification.remove();
    
    res.json({ success: true, message: 'Notification supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la notification' });
  }
});

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for the current user
 * @access  Private
 */
router.delete('/', authorize(), async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'Toutes les notifications ont été supprimées' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression des notifications' });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Create a test notification (development only)
 * @access  Private (development only)
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', authorize(), async (req, res) => {
    try {
      const { title, message, type } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: 'Le titre et le message sont requis' });
      }
      
      const notification = await notificationService.sendNotification({
        user: req.user.id,
        title,
        message,
        type: type || 'info',
        metadata: { isTest: true }
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la notification de test' });
    }
  });
}

module.exports = router;
