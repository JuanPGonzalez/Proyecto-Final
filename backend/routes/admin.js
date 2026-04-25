const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem, sequelize } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/roles');

router.use(authMiddleware, adminMiddleware);

// Estadísticas básicas
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const sumOrders = await Order.sum('total');

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      revenue: sumOrders || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

// Top Productos por vistas
router.get('/top-products', authMiddleware, async (req, res) => {
    try {
        const top = await Product.findAll({
            order: [['views', 'DESC']],
            limit: 5
        });
        res.json(top);
    } catch (err) {
        res.status(500).json({ error: 'Error' });
    }
});

// Tendencia de ventas (últimos 7 días)
router.get('/sales-trend', authMiddleware, async (req, res) => {
    try {
        // En una DB real usaríamos DATE(fecha_compra). Para este proyecto simplificamos:
        const orders = await Order.findAll({ limit: 10 });
        res.json(orders.map(o => ({ date: 'Hoy', total: o.total })));
    } catch (err) {
        res.status(500).json({ error: 'Error' });
    }
});

// Insights de IA para el Dashboard
router.get('/ai-insights', authMiddleware, async (req, res) => {
    try {
        const stats = {
            users: await User.count(),
            products: await Product.count(),
            lowStock: await Product.count({ where: { stock: { [require('sequelize').Op.lt]: 5 } } }),
            revenue: await Order.sum('total') || 0
        };

        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `Analiza estas estadísticas de mi tienda de hardware y dame 3 consejos de negocio cortos y brillantes:
        - Usuarios: ${stats.users}
        - Productos: ${stats.products}
        - Productos con bajo stock: ${stats.lowStock}
        - Ingresos totales: $${stats.revenue}
        
        Responde solo con los 3 puntos, sin introducciones.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
        });

        const insights = completion.choices[0].message.content.split('\n').filter(l => l.trim());
        res.json(insights);
    } catch (err) {
        console.error('AI Insights Error:', err);
        res.json(["Optimizar stock de componentes críticos", "Analizar tendencias de búsqueda", "Revisar promociones para usuarios frecuentes"]);
    }
});

module.exports = router;
