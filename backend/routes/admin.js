const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem } = require('../models');

// Middleware básico de autenticación (simplificado para admin)
// En un entorno real se usaría JWT auth middleware
const authMiddleware = (req, res, next) => {
    // Aquí validaríamos un Bearer token real. Para demo asumimos que el admin accede a estas rutas
    next();
};

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();

    // Suma de precios (asumiendo que hay una columna total)
    const sumOrders = await Order.sum('total');

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      revenue: sumOrders || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

module.exports = router;
