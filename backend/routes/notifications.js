const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authMiddleware } = require('../middleware/roles');

router.use(authMiddleware);

// Get all notifications for the logged in user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, user_id: req.user.id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    notification.is_read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Mark all notifications as read for the logged in user
router.put('/read-all', async (req, res) => {
  try {
    await Notification.update({ is_read: true }, {
      where: { user_id: req.user.id, is_read: false }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
