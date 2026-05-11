const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem, Category, SupportTicket, sequelize, Notification } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/roles');
const bcrypt = require('bcryptjs');

router.use(authMiddleware, adminMiddleware);

const { Op } = require('sequelize');

// Dashboard Data (Unificado y Avanzado con Comparativa)
router.get('/dashboard-data', async (req, res) => {
  try {
    const { startDate, endDate, compare, compareStart, compareEnd } = req.query;

    const getStatsForPeriod = async (start, end) => {
      let orderFilter = {};
      let userFilter = {};
      let ticketFilter = {};

      if (start && end) {
        const s = new Date(`${start}T00:00:00`);
        const e = new Date(`${end}T23:59:59`);
        orderFilter = { fecha_compra: { [Op.between]: [s, e] } };
        userFilter = { fechaReg: { [Op.between]: [s, e] } };
        ticketFilter = { created_at: { [Op.between]: [s, e] } };
      }

      const periodOrders = await Order.count({ where: orderFilter });
      const periodRevenue = await Order.sum('total', { where: orderFilter }) || 0;
      const newUsers = await User.count({ where: userFilter });

      // Trend data
      let salesTrend = [];
      let userRegistrations = [];
      if (start && end) {
        salesTrend = await Order.findAll({
          where: orderFilter,
          attributes: [
            [sequelize.fn('DATE', sequelize.col('fecha_compra')), 'date'],
            [sequelize.fn('SUM', sequelize.col('total')), 'total']
          ],
          group: [sequelize.fn('DATE', sequelize.col('fecha_compra'))],
          order: [[sequelize.fn('DATE', sequelize.col('fecha_compra')), 'ASC']]
        });

        userRegistrations = await User.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('fecha_reg')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: userFilter,
          group: [sequelize.fn('DATE', sequelize.col('fecha_reg'))],
          order: [[sequelize.fn('DATE', sequelize.col('fecha_reg')), 'ASC']]
        });
      }

      return { periodOrders, periodRevenue, newUsers, salesTrend, userRegistrations };
    };

    // 1. Métricas Globales (No afectadas por filtros)
    const globalStats = {
      totalUsers: await User.count(),
      totalProducts: await Product.count(),
      totalOrders: await Order.count(),
      totalRevenue: await Order.sum('total') || 0
    };

    // 2. Métricas del Periodo Actual
    const current = await getStatsForPeriod(startDate, endDate);

    // 3. Métricas del Periodo Anterior (Comparativa)
    let previous = null;
    if (startDate && endDate && compare === 'true') {
      let prevStartStr, prevEndStr;

      if (compareStart && compareEnd) {
        prevStartStr = compareStart;
        prevEndStr = compareEnd;
      } else {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diff = e.getTime() - s.getTime();
        const prevEnd = new Date(s.getTime() - 86400000); 
        const prevStart = new Date(prevEnd.getTime() - diff);
        
        prevStartStr = prevStart.toISOString().split('T')[0];
        prevEndStr = prevEnd.toISOString().split('T')[0];
      }
      
      previous = await getStatsForPeriod(prevStartStr, prevEndStr);
    }

    // 4. Rankings y Datos Estáticos
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.gt]: 0, [Op.lt]: 5 } },
      order: [['stock', 'ASC']],
      limit: 10
    });

    const outOfStockProducts = await Product.findAll({
      where: { stock: 0 },
      limit: 10
    });

    const topUsers = await Order.findAll({
      attributes: [
        'user_id',
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status IN ('Cerrada', 'Entregado') THEN total ELSE 0 END")), 'totalSpent'],
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status IN ('Cerrada', 'Entregado') THEN 1 ELSE NULL END")), 'closedCount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'Cancelada' THEN 1 ELSE NULL END")), 'cancelledCount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status NOT IN ('Cerrada', 'Entregado', 'Cancelada') THEN 1 ELSE NULL END")), 'pendingCount']
      ],
      where: (startDate && endDate) ? { 
        fecha_compra: { [Op.between]: [new Date(`${startDate}T00:00:00`), new Date(`${endDate}T23:59:59`)] } 
      } : {},
      group: ['user_id'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: 5,
      include: [{ 
        model: User, 
        attributes: ['name', 'email'],
        where: { tipoUsuario: 'cliente' }
      }]
    });

    const productsByCategory = await Product.findAll({
      attributes: ['categoria_id', [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count']],
      include: [{ model: Category, attributes: ['descripcion'] }],
      group: ['Product.categoria_id', 'Category.id']
    });

    const shippingMethods = await Order.findAll({
      attributes: ['shipping_method', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['shipping_method']
    });

    const topSellingProducts = await OrderItem.findAll({
      attributes: ['componente_id', [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalQuantity']],
      include: [
        { model: Product, attributes: ['name'] },
        { model: Order, attributes: [], where: (startDate && endDate) ? { 
            fecha_compra: { [Op.between]: [new Date(`${startDate}T00:00:00`), new Date(`${endDate}T23:59:59`)] } 
          } : {} 
        }
      ],
      group: ['componente_id', 'Product.id'],
      order: [[sequelize.literal('totalQuantity'), 'DESC']],
      limit: 5
    });

    res.json({
      global: globalStats,
      current,
      previous,
      rankings: {
        lowStockProducts,
        outOfStockProducts,
        topUsers: topUsers.map(u => ({
          id: u.user_id,
          name: u.User?.name || 'Anon',
          totalSpent: u.get('totalSpent') || 0,
          orderCount: u.get('orderCount') || 0,
          closedCount: u.get('closedCount') || 0,
          cancelledCount: u.get('cancelledCount') || 0,
          pendingCount: u.get('pendingCount') || 0
        })),
        productsByCategory: productsByCategory.map(c => ({
          category: c.Category?.descripcion || 'Sin Cat.',
          count: c.get('count')
        })),
        shippingMethods: shippingMethods.map(s => ({
          method: s.shipping_method || 'Desconocido',
          count: s.get('count')
        })),
        topSellingProducts: topSellingProducts.map(p => ({
          name: p.Product?.name || 'Desconocido',
          totalQuantity: p.get('totalQuantity')
        })),
        topProducts: await Product.findAll({ order: [['views', 'DESC']], limit: 5 })
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Analytics de Soporte
router.get('/dashboard/support', async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    let whereClause = {};
    let periodWhere = {};

    if (startDate && endDate) {
      const s = new Date(`${startDate}T00:00:00`);
      const e = new Date(`${endDate}T23:59:59`);
      periodWhere.created_at = { [Op.between]: [s, e] };
    }

    if (clientId && clientId !== 'all') {
      whereClause.user_id = Number(clientId);
      periodWhere.user_id = Number(clientId);
    }

    // 1. Métricas
    const abiertos = await SupportTicket.count({ where: { ...whereClause, status: 'abierto' } });
    const cerrados = await SupportTicket.count({ where: { ...whereClause, status: 'cerrado' } });
    const totalPeriodo = await SupportTicket.count({ where: periodWhere });

    // 2. Chart 1: Tickets por período (agrupados por día)
    let ticketsTrend = [];
    if (startDate && endDate) {
      ticketsTrend = await SupportTicket.findAll({
        where: periodWhere,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });
    }

    // 3. Historial del cliente (si está seleccionado)
    let clientHistory = [];
    if (clientId && clientId !== 'all') {
      clientHistory = await SupportTicket.findAll({
        where: { user_id: Number(clientId) },
        order: [['created_at', 'DESC']],
        limit: 10
      });
    }

    res.json({
      metrics: { abiertos, cerrados, totalPeriodo },
      charts: {
        ticketsTrend: ticketsTrend.map(t => ({
          date: t.get('date'),
          count: t.get('count')
        })),
        statusDistribution: { abiertos, cerrados }
      },
      clientHistory
    });

  } catch (error) {
    console.error('Support Analytics Error:', error);
    res.status(500).json({ error: 'Error al obtener analytics de soporte' });
  }
});

// Endpoint paginado para historial de compras
router.get('/purchase-history', async (req, res) => {
  try {
    const { page = 1, limit = 10, clientId, shippingType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (clientId && clientId !== 'all') {
      whereClause.user_id = Number(clientId);
    }
    
    if (shippingType && shippingType !== 'all') {
      if (shippingType === 'retiro') {
        whereClause.tipo_envio = 'retiro';
      }
      if (shippingType === 'envio') {
        whereClause.tipo_envio = 'envio';
      }
    }

    if (startDate && endDate) {
      whereClause.fecha_compra = {
        [Op.between]: [new Date(`${startDate}T00:00:00`), new Date(`${endDate}T23:59:59`)]
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          attributes: ['name', 'email'],
          where: { tipoUsuario: 'cliente' }
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['name'] }]
        }
      ],
      order: [['fecha_compra', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders: rows
    });

  } catch (error) {
    console.error('Purchase History Error:', error);
    res.status(500).json({ error: 'Error al obtener historial de compras' });
  }
});

// Detalle de cliente (Órdenes)
router.get('/client/:id/orders', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = { user_id: req.params.id };

    if (startDate && endDate) {
      whereClause.fecha_compra = {
        [Op.between]: [new Date(`${startDate}T00:00:00`), new Date(`${endDate}T23:59:59`)]
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [{ 
        model: OrderItem, 
        include: [{ model: Product, attributes: ['name'] }] 
      }],
      order: [['fecha_compra', 'DESC']],
      limit: 20 // Increased limit for better history view
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes del cliente' });
  }
});

// Detalle de cliente (Tickets)
router.get('/client/:id/tickets', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = { user_id: req.params.id };

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(`${startDate}T00:00:00`), new Date(`${endDate}T23:59:59`)]
      };
    }

    const tickets = await SupportTicket.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching client tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets del cliente' });
  }
});

// --- User Management ---

// List users (with optional role filter)
router.get('/users', async (req, res) => {
  try {
    const { tipoUsuario } = req.query;
    let whereClause = {};
    if (tipoUsuario) {
      whereClause.tipoUsuario = tipoUsuario;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'tipoUsuario', 'fechaReg'],
      order: [['fechaReg', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Create user manual
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, tipoUsuario } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      tipoUsuario: tipoUsuario || 'cliente'
    });

    // Notification for new user
    await Notification.create({
      user_id: newUser.id,
      message: `¡Bienvenido a Hardware Haven, ${newUser.name}! Tu cuenta ha sido creada por un administrador.`,
      type: 'SYSTEM'
    });

    const userToReturn = newUser.toJSON();
    delete userToReturn.password;
    res.json(userToReturn);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Update user (including role)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, tipoUsuario } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const roleChanged = user.tipoUsuario !== tipoUsuario && tipoUsuario;

    if (name) user.name = name;
    if (email) user.email = email;
    if (tipoUsuario) user.tipoUsuario = tipoUsuario;

    await user.save();

    if (roleChanged) {
      await Notification.create({
        user_id: user.id,
        message: `Tu rol en la plataforma ha sido actualizado a: ${tipoUsuario}.`,
        type: 'SYSTEM'
      });
    }

    const userToReturn = user.toJSON();
    delete userToReturn.password;
    res.json(userToReturn);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
