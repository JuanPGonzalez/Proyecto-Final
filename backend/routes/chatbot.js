const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { getCompatibleProducts } = require('../services/compatibilityService');

// ==========================================
// 🤖 GEMINI AI INTEGRATION
// ==========================================
let geminiModel = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key') {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('[Chatbot] Gemini AI conectado exitosamente.');
  } else {
    console.warn('[Chatbot] GEMINI_API_KEY no configurada. El chatbot usará solo respuestas locales.');
  }
} catch (err) {
  console.warn('[Chatbot] No se pudo inicializar Gemini:', err.message);
}

// ==========================================
// 🧠 KNOWLEDGE BASE & CONFIG
// ==========================================
const KNOWLEDGE_BASE = {
  LOCATION: "📍 Estamos ubicados en el corazón de Rosario: **Zeballos 1315**.",
  HOURS: "🕒 Atendemos de **Martes a Viernes**.\n- Mañana: 06:00 AM - 11:59 AM\n- Tarde: 04:00 PM - 10:00 PM",
  PAYMENTS: "💵 Aceptamos **Efectivo** al retirar en el local, **Transferencia Bancaria** y **Tarjeta de Crédito/Débito**.",
  SHIPPING: "🚚 Ofrecemos envío a domicilio a todo el país con costo calculado según tu ubicación, o retiro gratis en nuestro local de Rosario.",
  RETURNS: "🔄 Tienes **30 días corridos** para cambios o devoluciones.",
  WARRANTY: "🛡️ Todos los componentes cuentan con garantía oficial.",
  INVOICE: "🧾 La factura se genera automáticamente en PDF y se envía a tu email al confirmar la compra.",
  PREP_TIME: "⏳ Tardamos aproximadamente **3 días hábiles** en tener listo tu pedido.",
  ABOUT: "🏢 Hardware Haven nació en Rosario de la mano de **Ignacio Rodríguez**.",
  SOCIAL: "📱 Instagram: **@HardwareHaven_OK** | TikTok: **@HH_Gaming**",
};

const SYSTEM_PROMPT = `Eres el asistente virtual IA exclusivo de **Hardware Haven**, la tienda líder en hardware y componentes informáticos para gaming, diseño y productividad, ubicada en Rosario, Argentina.

🎯 TU ROL:
Eres un experto en hardware apasionado por el gaming y el armado de PCs. Tu objetivo es ayudar a los clientes a elegir los mejores componentes, resolver sus dudas técnicas y guiarlos en su compra.

🏢 INFORMACIÓN DE LA TIENDA:
- Ubicación: Zeballos 1315, Rosario, Santa Fe, Argentina.
- Horarios: Martes a Viernes. Mañana: 06:00 AM a 11:59 AM. Tarde: 04:00 PM a 10:00 PM. (Sábados, Domingos y Lunes cerrado).
- Métodos de pago: Efectivo (solo para retiro en el local), Transferencia Bancaria (se requiere enviar comprobante), y Tarjetas de Crédito/Débito.
- Envíos: Envíos a domicilio a todo el país (costo calculado en checkout según CP) o retiro gratis en nuestro local.
- Cambios y Devoluciones: 30 días corridos desde la recepción del producto.
- Garantía: Productos nuevos, en caja sellada, con garantía oficial del fabricante.
- Facturación: Se genera automáticamente en formato PDF y se envía al email del cliente al confirmar la compra.
- Tiempos: Aproximadamente 3 días hábiles de preparación tras la confirmación del pago.
- Fundador: Ignacio Rodríguez.
- Redes sociales: Instagram @HardwareHaven_OK | TikTok @HH_Gaming.

📋 REGLAS DE COMPORTAMIENTO Y TONO:
1. Idioma: Responde SIEMPRE en español de Argentina (usa "vos", "comprás", "tenés", "querés"). Sé amigable, entusiasta, empático y muy profesional.
2. Longitud: Sé conciso y directo. Limita tus respuestas a 3 o 4 oraciones como máximo para no saturar el chat, a menos que te pidan una explicación técnica.
3. Stock y Precios: TIENES ACCESO al catálogo actualizado al final de tus instrucciones. Revisa siempre este catálogo para responder sobre precios y disponibilidad real. Si un producto no está en el catálogo, asume que no hay stock actualmente.
4. Armado de PC: Si te piden recomendaciones de compatibilidad o armar una computadora, da tu recomendación experta basada en los productos que sí tienen stock en tu catálogo y envíalos a la herramienta "Armador de PC" (Presupuestador) que tenemos en la web.
5. Sinceridad: Si no sabés la respuesta a algo que no esté en este prompt, admitilo y deciles que nos hablen por Instagram.
6. Emojis: Usalos estratégicamente para darle vida al mensaje (🎮, 💻, 🚀, 🔧).`;

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

/**
 * Consulta a Gemini AI como fallback inteligente
 */
async function askGemini(userMessage) {
  if (!geminiModel) return null;
  
  try {
    // Inject the database catalog dynamically into the prompt
    const products = await Product.findAll({
      attributes: ['name', 'price', 'stock', 'description']
    });
    
    let catalogText = "\n\n📦 CATÁLOGO ACTUAL Y STOCK EN TIEMPO REAL:\n";
    if (products.length > 0) {
      catalogText += products.map(p => `- ${p.name} | Precio: $${p.price} | Stock: ${p.stock}`).join('\n');
    } else {
      catalogText += "No hay productos en la base de datos actualmente.";
    }

    const dynamicPrompt = SYSTEM_PROMPT + catalogText;

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: dynamicPrompt }] },
    });
    
    const response = result.response.text();
    return response;
  } catch (err) {
    console.error('[Chatbot] Gemini error:', err.message);
    return null;
  }
}

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

      // Validar stock antes de agregar
      if (Number(product.stock) <= 0) {
        return res.json({ 
          type: 'text', 
          message: `❌ Lo siento, **${product.name}** no tiene stock disponible en este momento. ¿Querés que te recomiende alternativas?` 
        });
      }

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

  // INFO INTENTS (respuestas directas antes de buscar productos)
  if (/\b(hola|buen(as|os)|dias|tardes|noches|saludos|que tal)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: "¡Hola! Bienvenido a **Hardware Haven** 🖥️. Soy tu asistente virtual. Podés preguntarme sobre productos, horarios, envíos, o cualquier duda que tengas. ¿En qué te puedo ayudar?" });
  }
  if (/\b(donde|ubicacion|sucursal|direccion|local|rosario)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.LOCATION });
  }
  if (/\b(horario|hora|atienden|abierto|cerrado|abren|cierran)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.HOURS });
  }
  if (/\b(pago|pagar|efectivo|tarjeta|transferencia|mercadopago)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.PAYMENTS });
  }
  if (/\b(envio|envios|enviar|domicilio|despacho|llega)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.SHIPPING });
  }
  if (/\b(devolucion|devolver|cambio|cambiar|arrepent)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.RETURNS });
  }
  if (/\b(garantia|warranty)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.WARRANTY });
  }
  if (/\b(factura|comprobante|ticket|recibo)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.INVOICE });
  }
  if (/\b(preparacion|preparar|cuanto tarda|dias habiles)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.PREP_TIME });
  }
  if (/\b(instagram|tiktok|redes|social)\b/.test(rawMsg)) {
    return res.json({ type: 'text', message: KNOWLEDGE_BASE.SOCIAL });
  }

  // --- PRODUCT SEARCH LOGIC ---
  if (keywords.length > 0) {
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
            stock: p.stock,
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
            products: alternatives.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              imgURL: p.imgURL,
              stock: p.stock,
              categoria_id: p.categoria_id,
              description: p.description?.length > 60 ? p.description.substring(0, 60) + '...' : p.description
            }))
          });
        }
      }

      // Si hubo resultados pero todos sin stock y sin alternativas
      if (results.length > 0) {
        return res.json({ type: 'text', message: `No tengo stock disponible de lo que buscás. ¿Querés que busque algo similar?` });
      }
    } catch (err) {
      console.error('Chatbot DB Error:', err);
    }
  }

  // ==========================================
  // 🤖 GEMINI AI FALLBACK
  // ==========================================
  if (geminiModel) {
    try {
      const geminiResponse = await askGemini(message);
      if (geminiResponse) {
        return res.json({ type: 'text', message: geminiResponse });
      }
    } catch (err) {
      console.error('[Chatbot] Gemini fallback error:', err);
    }
  }

  // FINAL FALLBACK (sin Gemini)
  return res.json({ type: 'text', message: "No encontré ese producto. ¿Querés que te recomiende algo similar? También podés preguntarme sobre horarios, envíos, medios de pago o cualquier duda sobre Hardware Haven." });
});

module.exports = router;
