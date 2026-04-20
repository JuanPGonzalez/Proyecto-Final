const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Product } = require('../models');

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Incrementar vistas
router.post('/:id/view', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if(product) {
      product.views += 1;
      await product.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar vistas' });
  }
});

// Recomendaciones
router.get('/recommendations', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['views', 'DESC']],
      limit: 4
    });
    res.json(products);
  } catch(error) {
    res.status(500).json({ error: 'Error en recomendaciones' });
  }
});

// Endpoint protegido para admin - Crear Producto
const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.tipoUsuario !== 'admin') {
      return res.status(403).json({ error: 'Prohibido: Se requiere rol de administrador' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, imgURL, stock } = req.body;
    const newProduct = await Product.create({
      name, description, price, imgURL: imgURL || 'https://via.placeholder.com/300', stock
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

module.exports = router;
