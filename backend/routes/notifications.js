const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authMiddleware } = require('../middleware/roles');

router.use(authMiddleware);

// Get all notifications for the logged in user
router.get('/', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { normalizeRole } = require('../middleware/roles');
    const userRole = normalizeRole(req.user.tipoUsuario);

    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id },
          { target_role: userRole }
        ]
      },
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
    const { Op } = require('sequelize');
    const { normalizeRole } = require('../middleware/roles');
    const userRole = normalizeRole(req.user.tipoUsuario);

    const notification = await Notification.findOne({ 
      where: { 
        id,
        [Op.or]: [
          { user_id: req.user.id },
          { target_role: userRole }
        ]
      } 
    });
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
    const { Op } = require('sequelize');
    const { normalizeRole } = require('../middleware/roles');
    const userRole = normalizeRole(req.user.tipoUsuario);

    await Notification.update({ is_read: true }, {
      where: { 
        is_read: false,
        [Op.or]: [
          { user_id: req.user.id },
          { target_role: userRole }
        ]
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
