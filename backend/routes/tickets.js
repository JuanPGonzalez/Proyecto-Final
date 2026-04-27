const express = require('express');
const router = express.Router();
const { SupportTicket, User } = require('../models');
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

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar reclamo' });
  }
});

module.exports = router;
