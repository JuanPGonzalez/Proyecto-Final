const express = require('express');
const router = express.Router();
const axios = require('axios');
const { UserView, Order, OrderItem, User, Product } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/roles');

// Obtener todas las categorías
router.get('/categories', async (req, res) => {
  try {
    const { Category } = require('../models');
    const categories = await Category.findAll({ order: [['descripcion', 'ASC']] });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { Category } = require('../models');
    const products = await Product.findAll({
      include: [{ model: Category, attributes: ['descripcion'] }]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Incrementar vistas y guardar actividad de usuario
router.post('/:id/view', async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.headers['user-id']; // Opcional, enviado desde el front si está logueado

    const product = await Product.findByPk(productId);
    if(product) {
      product.views += 1;
      await product.save();

      // Guardar en UserView si hay usuario
      if (userId && !isNaN(userId)) {
        const [userView, created] = await UserView.findOrCreate({
          where: { user_id: userId, product_id: productId },
          defaults: { count: 1 }
        });
        if (!created) {
          userView.count += 1;
          await userView.save();
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar vistas' });
  }
});

// Recomendaciones Personalizadas
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 8;
    
    let recommendedIds = new Set();
    let sources = { userViews: [], userPurchases: [], globalTrends: [] };

    // 1. Basado en vistas del usuario
    if (userId) {
      const userViews = await UserView.findAll({
        where: { user_id: userId },
        order: [['count', 'DESC']],
        limit: 10,
        include: [Product]
      });
      userViews.forEach(v => {
        if (v.Product) sources.userViews.push(v.Product);
      });
    }

    // 2. Basado en compras previas (categorías similares)
    if (userId) {
      const lastOrders = await Order.findAll({
        where: { user_id: userId },
        limit: 3,
        include: [{ model: OrderItem, include: [Product] }]
      });
      
      let boughtCategories = new Set();
      lastOrders.forEach(o => o.OrderItems.forEach(oi => {
        if (oi.Product) boughtCategories.add(oi.Product.categoria_id);
      }));

      if (boughtCategories.size > 0) {
        const categoryProducts = await Product.findAll({
          where: { categoria_id: { [Op.in]: Array.from(boughtCategories) } },
          limit: 10
        });
        sources.userPurchases = categoryProducts;
      }
    }

    // 3. Tendencias globales (Más vistos)
    const trends = await Product.findAll({
      order: [['views', 'DESC']],
      limit: 10
    });
    sources.globalTrends = trends;

    // Mezclar resultados priorizando usuario
    let finalProducts = [];
    const addProducts = (list) => {
      list.forEach(p => {
        if (finalProducts.length < limit && !recommendedIds.has(p.id) && p.stock > 0) {
          finalProducts.push(p);
          recommendedIds.add(p.id);
        }
      });
    };

    addProducts(sources.userViews);
    addProducts(sources.userPurchases);
    addProducts(sources.globalTrends);

    res.json(finalProducts);
  } catch(error) {
    console.error("Recommendations Error:", error);
    res.status(500).json({ error: 'Error en recomendaciones' });
  }
});

// Recomendaciones de Carrito (Compatibilidad)
router.get('/recommendations/cart', async (req, res) => {
  try {
    const { categoryIds, productIds } = req.query;
    if (!categoryIds) return res.json([]);

    const cats = String(categoryIds).split(',').map(Number);
    const pids = String(productIds || '').split(',').map(Number);

    // Lógica simple de compatibilidad
    // Si hay Motherboard (3), sugerir CPU (1) y RAM (2)
    // Si hay CPU (1), sugerir Cooler (6)
    let searchCats = [];
    if (cats.includes(3)) searchCats.push(1, 2);
    if (cats.includes(1)) searchCats.push(6, 3);
    if (cats.includes(4)) searchCats.push(5); // GPU -> Fuente/Gabinete

    if (searchCats.length === 0) {
      // Fallback: Accesorios generales (9)
      searchCats.push(9);
    }

    const recommendations = await Product.findAll({
      where: {
        categoria_id: { [Op.in]: searchCats },
        id: { [Op.notIn]: pids },
        stock: { [Op.gt]: 0 }
      },
      limit: 4,
      order: [['views', 'DESC']]
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Error en compatibilidad' });
  }
});


router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, stock, imgURL, categoryId, newCategoryName } = req.body;
    const { Category } = require('../models');
    
    let finalCategoryId = categoryId;

    if (newCategoryName) {
      const [newCat] = await Category.findOrCreate({
        where: { descripcion: newCategoryName }
      });
      finalCategoryId = newCat.id;
    }

    const newProduct = await Product.create({ 
      name, 
      description, 
      price, 
      stock, 
      imgURL, 
      categoria_id: finalCategoryId || 1 
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});


// Actualizar producto
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, stock, imgURL, categoryId, newCategoryName } = req.body;
    const { Category } = require('../models');
    
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    let finalCategoryId = categoryId;

    if (newCategoryName) {
      const [newCat] = await Category.findOrCreate({
        where: { descripcion: newCategoryName }
      });
      finalCategoryId = newCat.id;
    }

    const updateData = { name, description, price, stock, imgURL };
    if (finalCategoryId) updateData.categoria_id = finalCategoryId;

    await product.update(updateData);
    res.json(product);
  } catch (error) {
    console.error('Error in PUT /products/:id:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar producto' });
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
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'No se puede eliminar un producto que ya tiene ventas registradas. Considera bajar su stock a cero para ocultarlo.' });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
