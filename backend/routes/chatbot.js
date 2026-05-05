const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { getCompatibleProducts } = require('../services/compatibilityService');

// ==========================================
// 🧠 KNOWLEDGE BASE & CONFIG
// ==========================================
const KNOWLEDGE_BASE = {
  LOCATION: "📍 Estamos ubicados en el corazón de Rosario: **Zeballos 1315**.",
  HOURS: "🕒 Atendemos de **Martes a Viernes**.\n- Mañana: 06:00 AM - 11:59 AM\n- Tarde: 04:00 PM - 10:00 PM",
  PAYMENTS: "💵 Aceptamos únicamente **Efectivo** al retirar en el local.",
  SHIPPING: "🚚 No realizamos envíos a domicilio. Todo pedido se retira presencialmente.",
  RETURNS: "🔄 Tienes **30 días corridos** para cambios o devoluciones.",
  WARRANTY: "🛡️ Todos los componentes cuentan con garantía oficial.",
  INVOICE: "🧾 La factura se emite físicamente en el local al momento de abonar.",
  PREP_TIME: "⏳ Tardamos aproximadamente **3 días hábiles** en tener listo tu pedido.",
  ABOUT: "🏢 Hardware Haven nació en Rosario de la mano de **Ignacio Rodríguez**.",
  SOCIAL: "📱 Instagram: **@HardwareHaven_OK** | TikTok: **@HH_Gaming**",
};

const CATEGORY_MAP = {
  cooler: 6,
  cpu: 1,
  procesador: 1,
  grafica: 4,
  gpu: 4,
  video: 4,
  motherboard: 2,
  mother: 2,
  placa: 2,
  ram: 3,
  memoria: 3,
  disco: 5,
  ssd: 5,
  fuente: 7,
  gabinete: 8,
  teclado: 27,
  mouse: 28,
  monitor: 25
};

const STOP_WORDS = [
  'quiero', 'comprar', 'necesito', 'busco', 'tenes', 'vendes',
  'un', 'una', 'el', 'la', 'de', 'para', 'por', 'favor', 'che', 'hola'
];

// ==========================================
// 🛠️ UTILS
// ==========================================
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
};

const extractKeywords = (text) => {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.includes(word));
};

// ==========================================
// 🤖 BOT ROUTE
// ==========================================
router.post('/message', async (req, res) => {
  const { message, lastProducts, intent: clientIntent, productId: clientProductId, cartItems = [] } = req.body;
  
  // Handle Specific Intent (View Details)
  if (clientIntent === 'view_detail' && clientProductId) {
    try {
      const product = await Product.findByPk(clientProductId, {
        include: [{ model: Category, attributes: ['descripcion'] }]
      });
      if (!product) return res.json({ type: 'text', message: "No encontré ese producto.", products: [] });
      
      return res.json({
        type: 'product_detail',
        message: `Aquí tienes los detalles de **${product.name}**:`,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          category: product.Category?.descripcion || 'General',
          imgURL: product.imgURL
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error fetching details' });
    }
  }

  // Handle Add to Cart with UNIFIED Compatibility Recommendations
  if (clientIntent === 'add_to_cart' && clientProductId) {
    try {
      const product = await Product.findByPk(clientProductId);
      if (!product) return res.json({ type: 'text', message: "No encontré el producto para agregar." });

      // Add current product to cart simulation for compatibility service
      const updatedCart = [...cartItems, product];
      
      // USE THE UNIFIED SERVICE
      const relatedProducts = await getCompatibleProducts(updatedCart);

      return res.json({
        type: 'cart_update',
        message: `✅ ¡Listo! He sumado **${product.name}** a tu carrito.`,
        relatedProducts: relatedProducts
      });
    } catch (err) {
      console.error('Add to Cart Error:', err);
      return res.status(500).json({ error: 'Error adding to cart' });
    }
  }

  if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

  const rawMsg = message.toLowerCase().trim();
  const keywords = extractKeywords(rawMsg);
  
  // REDIRECT: BUILD PC
  if ((rawMsg.includes('armar') || rawMsg.includes('presupuesto')) && (rawMsg.includes('pc') || rawMsg.includes('computadora'))) {
    return res.json({
      type: 'redirect',
      message: '🚀 ¡Excelente idea! Te llevo a nuestro **Armador de PC**.',
      url: '/presupuestador'
    });
  }

  // INFO INTENTS
  if (/\b(hola|buen(as|os)|dias|tardes|noches|saludos|que tal)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: "¡Hola! Bienvenido a **Hardware Haven**. ¿Qué componente estás buscando hoy? 🖥️" });
  }
  if (/\b(donde|ubicacion|sucursal|direccion|local|rosario)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.LOCATION });
  }

  // --- SEARCH LOGIC ---
  if (keywords.length === 0) {
    return res.json({ type: 'text', message: "Dime qué producto buscas. Por ejemplo: 'procesador i7'." });
  }

  try {
    const results = await Product.findAll({
      where: {
        [Op.or]: keywords.map(word => ({
          [Op.or]: [
            { name: { [Op.like]: `%${word}%` } },
            { description: { [Op.like]: `%${word}%` } }
          ]
        }))
      },
      include: [{ model: Category, attributes: ['id', 'descripcion'] }],
      limit: 10
    });

    const inStock = results.filter(p => p.stock > 0).slice(0, 4);
    const outOfStock = results.filter(p => p.stock === 0);

    if (inStock.length > 0) {
      return res.json({
        type: 'products',
        message: `He encontrado estos productos para ti:`,
        products: inStock.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imgURL: p.imgURL,
          socket: p.socket,
          memoryType: p.memoryType,
          categoria_id: p.categoria_id,
          description: p.description?.length > 60 ? p.description.substring(0, 60) + '...' : p.description
        }))
      });
    }

    if (outOfStock.length > 0) {
      const detectedCatId = outOfStock[0].categoria_id;
      const alternatives = await Product.findAll({
        where: { categoria_id: detectedCatId, stock: { [Op.gt]: 0 } },
        limit: 4
      });
      if (alternatives.length > 0) {
        return res.json({
          type: 'products',
          message: `No tengo stock de **${outOfStock[0].name}**. Pero te recomiendo estas alternativas:`,
          products: alternatives
        });
      }
    }

    // FINAL FALLBACK
    return res.json({ type: 'text', message: "No encontré ese producto. ¿Querés que te recomiende algo similar?" });

  } catch (err) {
    console.error('Chatbot Error:', err);
    return res.json({ type: 'text', message: "Ups, tuve un error interno." });
  }
});

module.exports = router;
