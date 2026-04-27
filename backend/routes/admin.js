const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem, Category, SupportTicket, sequelize } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/roles');

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
      offset: parseInt(offset)
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

module.exports = router;
