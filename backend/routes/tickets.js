const express = require('express');
const router = express.Router();
const { SupportTicket, User, Notification } = require('../models');
const { authMiddleware, adminMiddleware, ROLES, isAdminRole } = require('../middleware/roles');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'Asunto y descripción son obligatorios' });

    const ticket = await SupportTicket.create({
      user_id: req.user.id,
      subject,
      description
    });

    // Notify admins
    try {
      const admins = await User.findAll({ where: { tipoUsuario: ROLES.ADMIN } });
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        message: `Nuevo ticket de soporte #${ticket.id} creado por el usuario ID: ${req.user.id}. Asunto: ${subject}`,
        type: 'TICKET'
      }));
      if (adminNotifications.length > 0) {
        await Notification.bulkCreate(adminNotifications);
      }
    } catch (e) {
      console.error('Error notifying admins about new ticket:', e);
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear reclamo' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status;
    const sortBy = req.query.sortBy || 'date_desc';

    const where = isAdminRole(req.user.tipoUsuario) ? {} : { user_id: req.user.id };
    if (statusFilter) where.status = statusFilter;

    let orderArray = [['created_at', 'DESC']];
    if (sortBy === 'date_asc') orderArray = [['created_at', 'ASC']];
    
    const { count, rows } = await SupportTicket.findAndCountAll({
      where,
      order: orderArray,
      limit,
      offset
    });

    res.json({
      tickets: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTickets: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reclamos' });
  }
});

router.put('/:id/respond', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, respuesta } = req.body;
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Reclamo no encontrado' });

    await ticket.update({
      status: status || ticket.status,
      respuesta: respuesta || ticket.respuesta,
      admin_id: req.user.id
    });

    // Notify user
    try {
      await Notification.create({
        user_id: ticket.user_id,
        message: `Tu ticket de soporte #${ticket.id} ha recibido una actualización. Estado: ${status || ticket.status}.`,
        type: 'TICKET'
      });
    } catch (e) {
      console.error('Error notifying user about ticket response:', e);
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar reclamo' });
  }
});

module.exports = router;
