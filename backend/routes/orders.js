const express = require('express');
const router = express.Router();
const { authMiddleware, clientMiddleware, isAdminRole } = require('../middleware/roles');
const sequelize = require('../config/database');
const { Order, OrderItem, Product, User } = require('../models');

// Obtener órdenes del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = isAdminRole(req.user.tipoUsuario) ? {} : { user_id: req.user.id };
    const include = [
      {
        model: OrderItem,
        include: [Product]
      }
    ];
    if (isAdminRole(req.user.tipoUsuario)) {
      include.push({ model: User, attributes: ['id', 'name', 'email', 'tipoUsuario'] });
    }

    const orders = await Order.findAll({
      where,
      include,
      order: [['id', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.post('/', authMiddleware, clientMiddleware, async (req, res) => {
  try {
    const { total, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No hay productos' });

    const order = await Order.create({
      total,
      user_id: req.user.id,
      fecha_compra: new Date()
    });

    for (const item of items) {
      await OrderItem.create({
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        compra_id: order.id,
        componente_id: item.productId
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Fallo al procesar la compra' });
  }
});

module.exports = router;
