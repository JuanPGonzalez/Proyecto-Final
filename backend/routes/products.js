const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Product } = require('../models');
const { adminMiddleware } = require('../middleware/roles');

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


router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, stock, imgURL, category } = req.body;
    let categoria_id = 1;
    if (category !== undefined && category !== null && category !== '') {
      const parsedCategory = Number(category);
      if (!Number.isNaN(parsedCategory) && parsedCategory > 0) {
        categoria_id = parsedCategory;
      }
    }

    const newProduct = await Product.create({ name, description, price, stock, imgURL, categoria_id });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});


// Actualizar producto
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, stock, imgURL, category } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const updateData = { name, description, price, stock, imgURL };
    if (category !== undefined && category !== null && category !== '') {
      const parsedCategory = Number(category);
      if (!Number.isNaN(parsedCategory) && parsedCategory > 0) {
        updateData.categoria_id = parsedCategory;
      }
    }

    await product.update(updateData);
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

// Endpoint de Análisis de IA para un producto específico
router.get('/:id/ai-analysis', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `Analiza este componente de hardware y dame 3 campos cortos:
        1. performance: Rendimiento esperado.
        2. compatibility: Tips de compatibilidad.
        3. tip: Un consejo experto.
        
        Producto: ${product.name}
        Descripción: ${product.description}
        
        Responde estrictamente en formato JSON: {"performance": "...", "compatibility": "...", "tip": "..."}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        res.json(analysis);
    } catch (err) {
        console.error('AI Analysis Error:', err);
        res.json({ 
            performance: "Alto rendimiento garantizado para gaming.", 
            compatibility: "Compatible con la mayoría de setups modernos.", 
            tip: "Asegúrate de tener una fuente de poder certificada." 
        });
    }
});

module.exports = router;
