const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { Op } = require('sequelize');

function getRelatedCategory(productName) {
  const q = (productName || '').toLowerCase();
  if (q.includes('rtx') || q.includes('rx') || q.includes('gpu') || q.includes('grafica') || q.includes('video')) return ['psu', 'cpu', 'gabinete', 'fuente'];
  if (q.includes('ryzen') || q.includes('intel') || q.includes('cpu') || q.includes('procesador')) return ['motherboard', 'ram', 'memoria'];
  if (q.includes('ram') || q.includes('ddr') || q.includes('memoria')) return ['cpu', 'ssd'];
  if (q.includes('teclado')) return ['mouse', 'pad'];
  return ['ram', 'ssd'];
}

router.post('/add', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ ok: false, error: 'productId es requerido' });

    // Verificar existencia
    const product = await Product.findByPk(productId, { raw: true });
    if (!product) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });

    // Inicializar carrito en sesión si no existe
    if (!req.session) req.session = {};
    if (!req.session.cart) req.session.cart = [];

    req.session.cart.push({ ...product, addedAt: new Date() });

    // Buscar relacionados (upsell)
    const relatedTerms = getRelatedCategory(product.name);
    const related = await Product.findAll({
      where: {
        stock: { [Op.gt]: 0 },
        id: { [Op.ne]: product.id },
        [Op.or]: relatedTerms.map(t => ({ name: { [Op.like]: `%${t}%` } })).concat(
          relatedTerms.map(t => ({ description: { [Op.like]: `%${t}%` } }))
        )
      },
      limit: 4,
      raw: true
    });

    return res.json({ ok: true, product, related });
  } catch (error) {
    console.error('Error in /api/cart/add:', error);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

module.exports = router;
