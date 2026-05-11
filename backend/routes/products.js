const express = require('express');
const router = express.Router();
const axios = require('axios');
const { UserView, Order, OrderItem, User, Product } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/roles');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

// Exportar productos a Excel
router.get('/export', adminMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll();
    const cleanData = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      categoria_id: p.categoria_id
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Error al exportar productos' });
  }
});

// Importar productos desde Excel
router.post('/import', adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let updated = 0;
    let skipped = 0;
    let errors = [];

    const processRow = async (row) => {
      try {
        if (!row.id) {
          skipped++;
          return;
        }

        const product = await Product.findByPk(row.id);
        if (!product) {
          skipped++;
          return;
        }

        const updateData = {};

        if (row.price !== undefined && !isNaN(row.price)) {
          updateData.price = Number(row.price);
        }

        if (row.stock !== undefined && !isNaN(row.stock) && row.stock >= 0) {
          updateData.stock = Number(row.stock);
        }

        if (Object.keys(updateData).length === 0) {
          skipped++;
          return;
        }

        await product.update(updateData);
        updated++;

      } catch (err) {
        errors.push({ row, error: err.message });
      }
    };

    if (rows.length > 100) {
      // Uso de Promise.all para "batching" como solicitado
      await Promise.all(rows.map(row => processRow(row)));
    } else {
      for (const row of rows) {
        await processRow(row);
      }
    }

    res.json({
      ok: true,
      updated,
      skipped,
      errors
    });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ error: 'Error al importar productos' });
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

      // Guardar en UserView si hay usuario y existe en la DB
      if (userId && !isNaN(userId)) {
        const userExists = await User.findByPk(userId);
        if (userExists) {
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
    console.log("REQ.BODY RECEIVED:", JSON.stringify(req.body, null, 2));
    const { name, description, price, stock, imgURL, categoryId, newCategoryName, precio_min, precio_max } = req.body;
    const { Category } = require('../models');
    
    const pBase = Number(price);
    const pMin = (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null;
    const pMax = (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null;

    if (pMin !== null && pMin > pBase) {
      return res.status(400).json({ error: "El precio mínimo no puede ser mayor al precio base" });
    }
    if (pMax !== null && pMax < pBase) {
      return res.status(400).json({ error: "El precio máximo no puede ser menor al precio base" });
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      return res.status(400).json({ error: "El precio mínimo no puede ser mayor al precio máximo" });
    }

    let finalCategoryId = categoryId;

    if (newCategoryName) {
      const [newCat] = await Category.findOrCreate({
        where: { descripcion: newCategoryName }
      });
      finalCategoryId = newCat.id;
    }

    const newProduct = await Product.create({ 
      name: name, 
      description: description, 
      price: price, 
      stock: stock, 
      imgURL: imgURL, 
      precio_min: (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null,
      precio_max: (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null,
      categoria_id: finalCategoryId || 1 
    });

    console.log("PRODUCT CREATED IN DB:", JSON.stringify(newProduct.toJSON(), null, 2));
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});


// Actualizar producto
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    console.log("REQ.BODY RECEIVED (UPDATE):", JSON.stringify(req.body, null, 2));
    const { name, description, price, stock, imgURL, categoryId, newCategoryName, precio_min, precio_max } = req.body;
    const { Category } = require('../models');
    
    const pBase = Number(price);
    const pMin = (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null;
    const pMax = (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null;

    if (pMin !== null && pMin > pBase) {
      return res.status(400).json({ error: "El precio mínimo no puede ser mayor al precio base" });
    }
    if (pMax !== null && pMax < pBase) {
      return res.status(400).json({ error: "El precio máximo no puede ser menor al precio base" });
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      return res.status(400).json({ error: "El precio mínimo no puede ser mayor al precio máximo" });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    let finalCategoryId = categoryId;

    if (newCategoryName) {
      const [newCat] = await Category.findOrCreate({
        where: { descripcion: newCategoryName }
      });
      finalCategoryId = newCat.id;
    }

    // MAPEO EXPLÍCITO PARA EVITAR PÉRDIDA DE DATOS
    const updateData = { 
      name: name, 
      description: description, 
      price: price, 
      stock: stock, 
      imgURL: imgURL,
      precio_min: (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null,
      precio_max: (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null
    };
    
    if (finalCategoryId) updateData.categoria_id = finalCategoryId;

    console.log("DATA TO BE UPDATED:", JSON.stringify(updateData, null, 2));
    await product.update(updateData);
    
    // VERIFICACIÓN INMEDIATA DE LECTURA DESPUÉS DE ESCRITURA
    const updatedProduct = await Product.findByPk(req.params.id);
    console.log("PRODUCT AFTER UPDATE IN DB:", JSON.stringify(updatedProduct.toJSON(), null, 2));

    res.json(updatedProduct);
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

// Actualización Masiva de Precios
router.post('/bulk-price-update', adminMiddleware, async (req, res) => {
  try {
    const { percentage, action } = req.body;
    
    if (!percentage || isNaN(percentage) || percentage <= 0) {
      return res.status(400).json({ error: 'Debe proveer un porcentaje válido mayor a 0.' });
    }
    
    if (action !== 'increase' && action !== 'decrease') {
      return res.status(400).json({ error: 'La acción debe ser "increase" o "decrease".' });
    }

    const factor = action === 'increase' ? (1 + (Number(percentage) / 100)) : (1 - (Number(percentage) / 100));

    // Obtener todos los productos y actualizar cada uno
    const products = await Product.findAll();
    
    let updatedCount = 0;
    
    await Promise.all(products.map(async (p) => {
      if (p.price) {
        const newPrice = Math.round(Number(p.price) * factor); // Redondeo simple para evitar muchos decimales
        if (newPrice > 0) {
          let boundedPrice = newPrice;
          if (p.precio_min && boundedPrice < p.precio_min) boundedPrice = Number(p.precio_min);
          if (p.precio_max && boundedPrice > p.precio_max) boundedPrice = Number(p.precio_max);
          await p.update({ price: boundedPrice });
          updatedCount++;
        }
      }
    }));

    res.json({ success: true, message: `Se actualizaron los precios de ${updatedCount} productos correctamente.` });
  } catch (error) {
    console.error('Error in bulk-price-update:', error);
    res.status(500).json({ error: 'Error al actualizar precios masivamente.' });
  }
});

module.exports = router;
