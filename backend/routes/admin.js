const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem, Category, SupportTicket, sequelize, Notification } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/roles');
const bcrypt = require('bcrypt');

router.use(authMiddleware, adminMiddleware);

const { Op } = require('sequelize');

// Dashboard Data (Unificado y Avanzado)
router.get('/dashboard-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Filtro de fecha para órdenes
    let orderDateFilter = {};
    let ticketDateFilter = {};
    if (startDate && endDate) {
      orderDateFilter = {
        fecha_compra: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
      ticketDateFilter = {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    // 1. Stats Generales
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count({ where: orderDateFilter });
    const sumOrders = await Order.sum('total', { where: orderDateFilter }) || 0;
    
    // 2. Alerta de Stock (Productos < 5)
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.gt]: 0, [Op.lt]: 5 } },
      order: [['stock', 'ASC']],
      limit: 10
    });

    const outOfStockProducts = await Product.findAll({
      where: { stock: 0 },
      limit: 10
    });

    // 3. Top Usuarios (Gastos)
    const topUsersQuery = await Order.findAll({
      where: orderDateFilter,
      attributes: [
        'user_id',
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent'],
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount']
      ],
      group: ['user_id'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: 5,
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    // 4. Tendencia de Ventas (Agrupadas por Fecha)
    const salesTrendQuery = await Order.findAll({
      where: orderDateFilter,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('fecha_compra')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('fecha_compra'))],
      order: [[sequelize.fn('DATE', sequelize.col('fecha_compra')), 'ASC']]
    });

    // 5. Rendimiento de Administradores en Soporte
    const adminPerformanceQuery = await SupportTicket.findAll({
      where: {
        ...ticketDateFilter,
        admin_id: { [Op.not]: null }
      },
      attributes: [
        'admin_id',
        [sequelize.fn('COUNT', sequelize.col('SupportTicket.id')), 'ticketsResolved']
      ],
      group: ['admin_id'],
      order: [[sequelize.literal('ticketsResolved'), 'DESC']],
      limit: 5
    });

    // Enriquecer datos de admins
    const adminPerformance = await Promise.all(adminPerformanceQuery.map(async (perf) => {
      const adminUser = await User.findByPk(perf.admin_id, { attributes: ['name'] });
      return {
        admin_name: adminUser ? adminUser.name : `Admin #${perf.admin_id}`,
        resolved: perf.get('ticketsResolved')
      };
    }));

    // 6. Top Productos por vistas (Histórico General)
    const topProducts = await Product.findAll({
      order: [['views', 'DESC']],
      limit: 5
    });

    // 7. Métodos de Envío
    const shippingMethodsQuery = await Order.findAll({
      where: orderDateFilter,
      attributes: [
        'shipping_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['shipping_method']
    });

    // 8. Productos más vendidos por cantidad (Considerando el filtro de fechas)
    const topSellingProductsQuery = await OrderItem.findAll({
      attributes: [
        'componente_id',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalQuantity']
      ],
      include: [
        { model: Product, attributes: ['name', 'price'] },
        { model: Order, attributes: [], where: orderDateFilter }
      ],
      group: ['componente_id', 'Product.id'],
      order: [[sequelize.literal('totalQuantity'), 'DESC']],
      limit: 5
    });

    // 9. Distribución de Productos por Categoría
    const productsByCategoryQuery = await Product.findAll({
      attributes: [
        'categoria_id',
        [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count']
      ],
      include: [{ model: Category, attributes: ['descripcion'] }],
      group: ['Product.categoria_id', 'Category.id', 'Category.descripcion']
    });

    // 10. Ingresos por Categoría (en el rango de fechas)
    const revenueByCategoryQuery = await OrderItem.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('OrderItem.cantidad * OrderItem.sub_total')), 'totalRevenue']
      ],
      include: [
        { 
          model: Product, 
          attributes: ['categoria_id'],
          include: [{ model: Category, attributes: ['descripcion'] }]
        },
        { model: Order, attributes: [], where: orderDateFilter }
      ],
      group: ['Product.id', 'Product.categoria_id', 'Product->Category.id', 'Product->Category.descripcion']
    });

    // 11. Registros de Usuarios (Tendencia)
    const userRegistrationsQuery = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('fecha_reg')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('fecha_reg'))],
      order: [[sequelize.fn('DATE', sequelize.col('fecha_reg')), 'ASC']],
      limit: 30
    });

    res.json({
      stats: { totalUsers, totalProducts, totalOrders, revenue: sumOrders },
      lowStockProducts,
      outOfStockProducts,
      topUsers: topUsersQuery.map(u => ({
        name: u.User?.name || 'Usuario Desconocido',
        email: u.User?.email || '',
        totalSpent: u.get('totalSpent'),
        orders: u.get('orderCount')
      })),
      salesTrend: salesTrendQuery.map(t => ({
        date: t.get('date'),
        total: t.get('total'),
        count: t.get('count')
      })),
      adminPerformance,
      topProducts,
      shippingMethods: shippingMethodsQuery.map(s => ({
        method: s.shipping_method || 'Desconocido',
        count: s.get('count')
      })),
      topSellingProducts: topSellingProductsQuery.map(p => ({
        name: p.Product?.name || 'Producto Desconocido',
        price: p.Product?.price || 0,
        totalQuantity: p.get('totalQuantity')
      })),
      productsByCategory: productsByCategoryQuery.map(c => ({
        category: c.Category?.descripcion || 'Sin Categoría',
        count: c.get('count')
      })),
      revenueByCategory: revenueByCategoryQuery.map(r => ({
        category: r.Product?.Category?.descripcion || 'Sin Categoría',
        revenue: r.get('totalRevenue')
      })),
      userRegistrations: userRegistrationsQuery.map(u => ({
        date: u.get('date'),
        count: u.get('count')
      }))
    });

  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

// Endpoint paginado para historial de compras
router.get('/purchase-history', async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, shippingMethod, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (userId) whereClause.user_id = userId;
    if (shippingMethod) whereClause.shipping_method = shippingMethod;

    if (startDate && endDate) {
      whereClause.fecha_compra = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['name', 'email'] },
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

// --- User Management ---

// List users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
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
