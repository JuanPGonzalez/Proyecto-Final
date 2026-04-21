const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
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
      name, description, price, imgURL: imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg==', stock
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Proxy para buscar en Mercado Libre (Importación)
router.get('/ml-import', adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Falta término de búsqueda' });

    // 1. Buscamos en MLA
    const searchRes = await axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=5`);
    const results = searchRes.data.results;

    // 2. Para cada resultado, intentamos obtener imagen de alta calidad
    const enrichedResults = await Promise.all(results.map(async (item) => {
      try {
        const itemDetail = await axios.get(`https://api.mercadolibre.com/items/${item.id}`);
        return {
          id: item.id,
          name: item.title,
          price: item.price,
          currency: item.currency_id,
          // Extraemos la primera imagen de alta resolución si existe
          imgURL: itemDetail.data.pictures?.[0]?.url || item.thumbnail,
          permalink: item.permalink
        };
      } catch (e) {
        return { id: item.id, name: item.title, price: item.price, imgURL: item.thumbnail };
      }
    }));

    res.json(enrichedResults);
  } catch (error) {
    console.error('Error ML API:', error.message);
    res.status(500).json({ error: 'Error al consultar Mercado Libre' });
  }
});

// Actualizar producto
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, imgURL, stock } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.update({ name, description, price, imgURL, stock });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.destroy();
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
