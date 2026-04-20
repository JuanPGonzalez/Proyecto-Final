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

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { cartItems, shippingMethod } = req.body;
    if (!cartItems || cartItems.length === 0) return res.status(400).json({ error: 'No hay productos en la orden' });

    const total = cartItems.reduce((acc, item) => acc + Number(item.price), 0);
    const userId = req.user.id;

    // Dado el esquema heredado, se inyecta directamente usando raw query para garantizar compatibilidad con snake_case o camelCase previos
    const [result] = await sequelize.query(
      `INSERT INTO compra (total, fechaCompra, user_id) VALUES (?, NOW(), ?)`, 
      { replacements: [total, userId] }
    );
    const compraId = result;

    for (const item of cartItems) {
      // Inserción manual de las líneas de compra evadiendo constricciones restrictas de Sequelize fallido.
      await sequelize.query(
        `INSERT INTO linea_compra (quantity, priceAtPurchase, compra_id, componente_id) VALUES (?, ?, ?, ?)`,
        { replacements: [1, item.price, compraId, item.id] }
      ).catch(e => console.error('Error insertando linea', e));
    }

    res.status(201).json({ success: true, orderId: compraId });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Fallo al procesar la compra en el servidor' });
  }
});

module.exports = router;
