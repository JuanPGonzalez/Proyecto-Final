const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const { Order, OrderItem, Product } = require('../models');

// Obtener órdenes del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id }, // Asumiendo que el campo es user_id en la DB
      include: [{
        model: OrderItem,
        include: [Product]
      }],
      order: [['id', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { total, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No hay productos' });

    const order = await Order.create({
      total,
      status: 'completed',
      user_id: req.user.id, // Sequelize mapeará esto
      fecha_compra: new Date() // Si la columna es fecha_compra
    });

    for (const item of items) {
      await OrderItem.create({
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        orderId: order.id, // Sequelize usará el foreignKey mapeado (compra_id)
        productId: item.productId // Sequelize usará el foreignKey mapeado (componente_id)
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Fallo al procesar la compra' });
  }
});

module.exports = router;
