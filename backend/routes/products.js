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
      description: p.description,
      precio_actual: p.price,
      precio_base: p.base_price,
      stock: p.stock,
      views: p.views,
      img_url: p.imgURL || '',
      socket: p.socket,
      memory_type: p.memoryType,
      precio_min: p.precio_min,
      precio_max: p.precio_max,
      categoria_id: p.categoria_id,
      is_active: p.isActive
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
    let created = 0;
    let errors = [];

    const processRow = async (row) => {
      try {
        let product = null;
        
        if (row.id) {
          product = await Product.findByPk(row.id);
        }

        if (!product) {
          // CREATE NEW PRODUCT (ya sea porque no mandó ID, o mandó un ID que no existe)
          const newData = {
            id: row.id || undefined, // Intentar respetar el ID si lo mandó
            name: row.name || 'Sin Nombre',
            description: row.description || 'Sin Descripción',
            price: Number(row.precio_actual !== undefined ? row.precio_actual : row.price) || 0,
            base_price: Number(row.precio_base) || 0,
            stock: Number(row.stock) || 0,
            categoria_id: Number(row.categoria_id) || 1,
            socket: row.socket || null,
            memoryType: row.memory_type || row.memoryType || null,
            precio_min: Number(row.precio_min) || null,
            precio_max: Number(row.precio_max) || null,
            isActive: row.is_active !== undefined ? Boolean(row.is_active) : true
          };
          
          const imgValCreate = row.img_url || row.imgURL || row.imgurl || row.image || row['URL Imagen'];
          if (imgValCreate) {
            newData.imgURL = String(imgValCreate).trim();
          } else {
            newData.imgURL = null;
          }
          
          await Product.create(newData);
          created++;
          return;
        }

        const updateData = {};

        // Actualización Completa (Upsert Full)
        if (row.name !== undefined) updateData.name = row.name;
        if (row.description !== undefined) updateData.description = row.description;
        if (row.socket !== undefined) updateData.socket = row.socket;
        
        const memoryVal = row.memory_type !== undefined ? row.memory_type : row.memoryType;
        if (memoryVal !== undefined) updateData.memoryType = memoryVal;
        
        if (row.categoria_id !== undefined && !isNaN(row.categoria_id)) updateData.categoria_id = Number(row.categoria_id);

        const priceVal = row.precio_actual !== undefined ? row.precio_actual : row.price;
        if (priceVal !== undefined && !isNaN(priceVal) && priceVal >= 0) {
          updateData.price = Number(priceVal);
        }

        if (row.precio_base !== undefined && !isNaN(row.precio_base) && row.precio_base >= 0) {
          updateData.base_price = Number(row.precio_base);
        }

        if (row.stock !== undefined && !isNaN(row.stock) && row.stock >= 0) {
          updateData.stock = Number(row.stock);
        }

        if (row.precio_min !== undefined && !isNaN(row.precio_min) && row.precio_min >= 0) {
          updateData.precio_min = Number(row.precio_min);
        }

        if (row.precio_max !== undefined && !isNaN(row.precio_max) && row.precio_max >= 0) {
          updateData.precio_max = Number(row.precio_max);
        }

        const imgValUpdate = row.img_url || row.imgURL || row.imgurl || row.image || row['URL Imagen'];
        if (imgValUpdate !== undefined && imgValUpdate !== null) {
          updateData.imgURL = String(imgValUpdate).trim();
        }

        if (row.is_active !== undefined) {
           updateData.isActive = Boolean(row.is_active);
        }

        if (Object.keys(updateData).length === 0) {
          skipped++;
          return;
        }

        const oldPrice = Number(product.price);
        await product.update(updateData);
        updated++;

        if (updateData.price && Number(updateData.price) !== oldPrice) {
          const { LogMotorPrecio } = require('../models');
          if (LogMotorPrecio) {
            await LogMotorPrecio.create({
              componente_id: product.id,
              precio_anterior: oldPrice,
              precio_nuevo: Number(updateData.price),
              detalle: "Carga Masiva de Precios (Excel)",
              origen: 'masivo',
              estado: 'success'
            });
          }
        }

      } catch (err) {
        console.error('Error procesando fila Excel:', row, err.message);
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
      created,
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
    const { Category, LogMotorPrecio } = require('../models');
    const { Op } = require('sequelize');
    const whereClause = {};
    if (req.query.includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (req.query.search) {
      whereClause.name = {
        [Op.like]: `%${req.query.search}%`
      };
    }

    if (req.query.categoryId) {
      whereClause.categoria_id = req.query.categoryId;
    }

    const products = await Product.findAll({
      where: whereClause,
      include: [{ model: Category, attributes: ['descripcion'] }]
    });

    // Check recent AI updates (last 24 hours)
    let recentAIPIds = new Set();
    if (LogMotorPrecio) {
      const recentLogs = await LogMotorPrecio.findAll({
        attributes: ['componente_id'],
        where: {
          origen: 'motor',
          created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        group: ['componente_id']
      });
      recentAIPIds = new Set(recentLogs.map(l => l.componente_id));
    }

    const enrichedProducts = products.map(p => {
      const pJson = p.toJSON();
      pJson.recentAIUpdate = recentAIPIds.has(p.id);
      return pJson;
    });

    res.json(enrichedProducts);
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
        include: [{ model: Product, where: { isActive: true, stock: { [Op.gt]: 0 } } }]
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
          where: { 
            categoria_id: { [Op.in]: Array.from(boughtCategories) },
            isActive: true,
            stock: { [Op.gt]: 0 }
          },
          limit: 10
        });
        sources.userPurchases = categoryProducts;
      }
    }

    // 3. Tendencias globales (Más vistos)
    const trends = await Product.findAll({
      where: { isActive: true, stock: { [Op.gt]: 0 } },
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

    // Lógica avanzada de "Completa tu Setup"
    const userHas = new Set(cats);
    let searchCats = new Set();

    // Reglas de armado de PC (intentar ofrecer lo que falta)
    if (userHas.has(1) || userHas.has(3) || userHas.has(4)) { // Si tiene CPU, Mother o GPU
      if (!userHas.has(1)) searchCats.add(1); // Le falta CPU
      if (!userHas.has(3)) searchCats.add(3); // Le falta Mother
      if (!userHas.has(2)) searchCats.add(2); // Le falta RAM
      if (!userHas.has(6)) searchCats.add(6); // Le falta Cooler
      if (!userHas.has(23)) searchCats.add(23); // Le falta Almacenamiento
      if (!userHas.has(4)) searchCats.add(4); // Le falta GPU
      if (!userHas.has(5)) searchCats.add(5); // Le falta Gabinete
    } else {
      // Si está comprando cosas sueltas (ej: solo RAM, solo Periféricos)
      if (userHas.has(2) && !userHas.has(23)) searchCats.add(23); // Compró RAM, sugerir disco
      if (userHas.has(23) && !userHas.has(2)) searchCats.add(2); // Compró disco, sugerir RAM
    }

    // Agregar periféricos / accesorios de forma aleatoria para llenar cupos
    if (!userHas.has(9)) searchCats.add(9);
    if (!userHas.has(27)) searchCats.add(27);
    if (!userHas.has(28)) searchCats.add(28);

    const categoriesToSearch = Array.from(searchCats);

    const recommendations = await Product.findAll({
      where: {
        categoria_id: { [Op.in]: categoriesToSearch },
        id: { [Op.notIn]: pids },
        isActive: true,
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
// Resumen de tendencias de precio
router.get('/pricing/summary', adminMiddleware, async (req, res) => {
  try {
    const { Category, LogMotorPrecio, Product } = require('../models');
    
    const products = await Product.findAll({
      include: [{ model: Category, attributes: ['descripcion'] }]
    });

    const logs = await LogMotorPrecio.findAll({
      order: [['created_at', 'ASC']]
    });
    
    const lastLogsMap = {};
    for (const log of logs) {
      lastLogsMap[log.componente_id] = log;
    }

    const summary = products.map(p => {
      const pJson = p.toJSON();
      const lastLog = lastLogsMap[p.id];
      let trend = 'mantuvo';
      if (lastLog) {
        if (Number(lastLog.precio_nuevo) > Number(lastLog.precio_anterior)) trend = 'subio';
        else if (Number(lastLog.precio_nuevo) < Number(lastLog.precio_anterior)) trend = 'bajo';

        if (lastLog.origen === 'motor') {
            const timeDiff = Date.now() - new Date(lastLog.created_at).getTime();
            if (timeDiff <= 24 * 60 * 60 * 1000) {
                pJson.recentAIUpdate = true;
            }
        }
      }
      return { ...pJson, trend };
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen de precios' });
  }
});

// Historial de precios de un producto
router.get('/:id/price-history', adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const { LogMotorPrecio, Product } = require('../models');
    
    const product = await Product.findByPk(productId);
    const { Op } = require('sequelize');
    const { startDate, endDate } = req.query;
    const whereClause = { componente_id: productId };
    if (startDate && endDate) {
      whereClause.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59Z')] };
    } else if (startDate) {
      whereClause.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.created_at = { [Op.lte]: new Date(endDate + 'T23:59:59Z') };
    }

    const logs = await LogMotorPrecio.findAll({
      where: whereClause,
      order: [['created_at', 'ASC']]
    });

    res.json({ product, logs });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Error al obtener historial de precios' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    console.log("REQ.BODY RECEIVED:", JSON.stringify(req.body, null, 2));
    const { name, description, price, stock, imgURL, categoryId, newCategoryName, precio_min, precio_max } = req.body;
    
    // --- INICIO DTO VALIDATION ---
    const errors = [];
    if (!name || name.trim() === '') errors.push("El campo 'nombre' es obligatorio.");
    if (price === undefined || price === null || isNaN(Number(price))) errors.push("El campo 'precio base' debe ser un número válido.");
    else if (Number(price) < 0) errors.push("El 'precio base' no puede ser negativo.");
    
    if (stock === undefined || stock === null || isNaN(Number(stock))) errors.push("El campo 'stock' debe ser un número válido.");
    else if (Number(stock) < 0) errors.push("El 'stock' no puede ser negativo.");
    
    if (!categoryId && !newCategoryName) errors.push("Debe proporcionar una categoría existente o un nombre para una nueva categoría.");

    if (errors.length > 0) {
      return res.status(400).json({ error: "Datos inválidos", details: errors });
    }
    // --- FIN DTO VALIDATION ---

    const { Category } = require('../models');
    
    const pBase = Number(price);
    const pMin = (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null;
    const pMax = (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null;

    if (pMin !== null && pMin > pBase) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio mínimo no puede ser mayor al precio base"] });
    }
    if (pMax !== null && pMax < pBase) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio máximo no puede ser menor al precio base"] });
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio mínimo no puede ser mayor al precio máximo"] });
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
    
    // --- INICIO DTO VALIDATION ---
    const errors = [];
    if (name !== undefined && name.trim() === '') errors.push("El campo 'nombre' no puede estar vacío.");
    if (price !== undefined && (price === null || isNaN(Number(price)))) errors.push("El campo 'precio base' debe ser un número válido.");
    else if (price !== undefined && Number(price) < 0) errors.push("El 'precio base' no puede ser negativo.");
    
    if (stock !== undefined && (stock === null || isNaN(Number(stock)))) errors.push("El campo 'stock' debe ser un número válido.");
    else if (stock !== undefined && Number(stock) < 0) errors.push("El 'stock' no puede ser negativo.");

    if (errors.length > 0) {
      return res.status(400).json({ error: "Datos inválidos", details: errors });
    }
    // --- FIN DTO VALIDATION ---

    const { Category } = require('../models');
    
    const pBase = Number(price);
    const pMin = (precio_min !== undefined && precio_min !== '' && precio_min !== null) ? Number(precio_min) : null;
    const pMax = (precio_max !== undefined && precio_max !== '' && precio_max !== null) ? Number(precio_max) : null;

    if (pMin !== null && pMin > pBase) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio mínimo no puede ser mayor al precio base"] });
    }
    if (pMax !== null && pMax < pBase) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio máximo no puede ser menor al precio base"] });
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      return res.status(400).json({ error: "Datos inválidos", details: ["El precio mínimo no puede ser mayor al precio máximo"] });
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
    const oldPrice = Number(product.price);
    await product.update(updateData);
    
    // VERIFICACIÓN INMEDIATA DE LECTURA DESPUÉS DE ESCRITURA
    const updatedProduct = await Product.findByPk(req.params.id);
    console.log("PRODUCT AFTER UPDATE IN DB:", JSON.stringify(updatedProduct.toJSON(), null, 2));

    if (updateData.price && Number(updateData.price) !== oldPrice) {
      const { LogMotorPrecio } = require('../models');
      if (LogMotorPrecio) {
        await LogMotorPrecio.create({
          componente_id: updatedProduct.id,
          precio_anterior: oldPrice,
          precio_nuevo: Number(updateData.price),
          detalle: "Actualización Manual de Administrador",
          origen: 'manual',
          estado: 'success'
        });
      }
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error in PUT /products/:id:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar producto' });
  }
});

// Eliminar producto (Borrado Lógico)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.update({ isActive: false });
    res.json({ success: true, message: 'Producto ocultado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Reactivar producto
router.patch('/:id/reactivate', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.update({ isActive: true });
    res.json({ success: true, message: 'Producto reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reactivar producto' });
  }
});

// Actualización Masiva de Precios
router.post('/bulk-price-update', adminMiddleware, async (req, res) => {
  try {
    const { percentage, action, productIds } = req.body;
    
    if (!percentage || isNaN(percentage) || percentage <= 0) {
      return res.status(400).json({ error: 'Debe proveer un porcentaje válido mayor a 0.' });
    }
    
    if (action !== 'increase' && action !== 'decrease') {
      return res.status(400).json({ error: 'La acción debe ser "increase" o "decrease".' });
    }

    const factor = action === 'increase' ? (1 + (Number(percentage) / 100)) : (1 - (Number(percentage) / 100));

    // Obtener todos los productos (o los filtrados) y actualizar cada uno
    const whereClause = {};
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      whereClause.id = productIds;
    }

    const products = await Product.findAll({ where: whereClause });
    
    let updatedCount = 0;
    
    await Promise.all(products.map(async (p) => {
      const updates = {};
      let hasUpdates = false;

      if (p.price) {
        const newPrice = Math.round(Number(p.price) * factor);
        if (newPrice > 0) {
          updates.price = newPrice;
          hasUpdates = true;
        }
      }

      if (p.precio_min) {
        const newMin = Math.round(Number(p.precio_min) * factor);
        if (newMin > 0) {
          updates.precio_min = newMin;
          hasUpdates = true;
        }
      }

      if (p.precio_max) {
        const newMax = Math.round(Number(p.precio_max) * factor);
        if (newMax > 0) {
          updates.precio_max = newMax;
          hasUpdates = true;
        }
      }

      // Re-validar límites en el precio resultante
      if (updates.price) {
        const finalMin = updates.precio_min !== undefined ? updates.precio_min : (p.precio_min ? Number(p.precio_min) : null);
        const finalMax = updates.precio_max !== undefined ? updates.precio_max : (p.precio_max ? Number(p.precio_max) : null);
        
        if (finalMin !== null && updates.price < finalMin) updates.price = finalMin;
        if (finalMax !== null && updates.price > finalMax) updates.price = finalMax;
      }

      if (hasUpdates) {
        const oldPrice = Number(p.price);
        await p.update(updates);
        updatedCount++;
        
        if (updates.price && Number(updates.price) !== oldPrice) {
          const { LogMotorPrecio } = require('../models');
          if (LogMotorPrecio) {
            await LogMotorPrecio.create({
              componente_id: p.id,
              precio_anterior: oldPrice,
              precio_nuevo: Number(updates.price),
              detalle: `Ajuste masivo general: ${action === 'increase' ? '+' : '-'}${percentage}%`,
              origen: 'masivo',
              estado: 'success'
            });
          }
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
