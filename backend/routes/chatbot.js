const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// ==========================================
// 🧠 EXPANDED KNOWLEDGE BASE (THE "BRAIN")
// ==========================================
// ==========================================
// 🧠 EXPANDED KNOWLEDGE BASE (THE "BRAIN")
// ==========================================
const KNOWLEDGE_BASE = {
  // Business Info
  LOCATION: "📍 Estamos ubicados en el corazón de Rosario: **Zeballos 1315**. Es nuestra única sucursal física por el momento.",
  HOURS: "🕒 Atendemos de **Martes a Viernes**.\n- Mañana: 06:00 AM - 11:59 AM\n- Tarde: 04:00 PM - 10:00 PM\n*Lunes, Sábados y Domingos la sucursal permanece cerrada.*",
  PAYMENTS: "💵 Por ahora aceptamos únicamente **Efectivo** al momento de retirar en el local. Estamos trabajando para integrar pagos con tarjeta y transferencia muy pronto.",
  SHIPPING: "🚚 No realizamos envíos a domicilio. Todo pedido realizado en la web debe ser retirado presencialmente en nuestra sucursal de Rosario.",
  RETURNS: "🔄 Tienes un plazo de **30 días corridos** para cambios o devoluciones, siempre que el producto esté en su empaque original y sin daños por mal uso.",
  WARRANTY: "🛡️ Todos los componentes cuentan con garantía oficial. Si algo falla, tráelo a la sucursal con el comprobante de compra para que nuestro servicio técnico lo revise.",
  INVOICE: "🧾 La factura se emite de forma física en el local al momento de abonar y retirar el pedido.",
  PREP_TIME: "⏳ Una vez que confirmas tu pedido en la web, tardamos aproximadamente **3 días hábiles** en tenerlo listo para que pases a buscarlo.",
  ABOUT: "🏢 Hardware Haven nació en Rosario de la mano de **Ignacio Rodríguez**. Somos apasionados por el hardware de alto rendimiento.",
  SOCIAL: "📱 ¡Síguenos! \n- Instagram: **@HardwareHaven_OK**\n- TikTok: **@HH_Gaming**",
  
  // Technical / Advice
  COMPATIBILITY: "🧩 La compatibilidad es clave. Revisa que el socket (AM4, LGA1700) y el tipo de memoria (DDR4, DDR5) coincidan entre tu procesador y tu motherboard.",
  POWER_SUPPLY: "⚡ Para una PC Gamer equilibrada, busca fuentes de al menos **600W o 700W** con certificación **80 Plus Bronze**. Evita las fuentes genéricas para componentes caros.",
  RAM_ADVICE: "🚀 Para gaming moderno y multitasking, **16GB de RAM** es el estándar. Si haces edición de video o streaming pesado, considera subir a 32GB.",
  SSD_ADVICE: "💾 ¡Instala siempre el Windows en un **SSD**! El cambio de velocidad es abismal comparado con un disco rígido tradicional.",
  MAINTENANCE: "🛠️ Recomendamos hacer una limpieza profunda y cambio de pasta térmica al menos **una vez al año** para evitar sobrecalentamiento.",
  MONITORS: "🖥️ Si juegas shooters, busca paneles **TN o IPS** con 144Hz. Si buscas calidad de color para diseño, un panel **IPS 4K** es tu mejor opción.",
  KEYBOARDS: "⌨️ ¿Buscas un teclado mecánico? Los switches **Red** son silenciosos y rápidos para jugar, mientras que los **Blue** son ruidosos pero excelentes para escribir.",
  MICE: "🖱️ Para juegos competitivos, busca un mouse con sensor óptico de alta precisión y que sea liviano para movimientos rápidos.",
  BUNDLES: "🎁 ¡Consulta por nuestros combos de **Actualización (Mother + Micro + RAM)**! Suelen tener un precio especial comparado a comprar los componentes por separado."
};

// ==========================================
// 🔍 SYNONYM MAPPER (IMPROVES UNDERSTANDING)
// ==========================================
const SYNONYMS = {
  "gpu": ["placa de video", "grafica", "nvidia", "radeon", "rtx", "geforce", "video", "gtx", "rx"],
  "cpu": ["procesador", "micro", "intel", "ryzen", "core", "amd", "i5", "i7", "i9", "r5", "r7"],
  "motherboard": ["madre", "placa base", "mother", "mobo", "b450", "b550", "h610", "z790"],
  "ram": ["memoria", "stick", "ddr4", "ddr5", "fury", "vengeance"],
  "storage": ["disco", "ssd", "hdd", "solido", "m2", "nvme", "almacenamiento", "terabyte", "giga"],
  "psu": ["fuente", "poder", "alimentacion", "watts", "80 plus", "bronze", "gold", "certificada"],
  "case": ["gabinete", "torre", "caja", "atx", "vidrio"],
  "peripherals": ["teclado", "mouse", "raton", "auriculares", "monitor", "pantalla", "headset", "cascos"],
  "maintenance": ["limpieza", "pasta termica", "service", "mantenimiento", "limpiar", "calienta"]
};

// ==========================================
// 👋 RESPONSE POOLS
// ==========================================
const GREETINGS = [
  "¡Hola! Bienvenido a Hardware Haven. ¿Qué componente estás buscando hoy? 🖥️",
  "¡Buenas! Soy tu asistente virtual. Puedo ayudarte con stock, precios o info del local. 😊",
  "Hola, ¿cómo estás? ¿En qué puedo asesorarte hoy? Tengo acceso a todo nuestro catálogo."
];

const NOT_FOUND = [
  "Lo siento, no pude encontrar exactamente lo que buscas. Pero no te preocupes, aquí tienes los componentes más populares de nuestra tienda: 🔥",
  "Por el momento no tenemos ese artículo específico en stock, pero te comparto lo más vendido por si te sirve de inspiración: 🧐",
  "No logré identificar esos productos en nuestro catálogo actual. ¿Te gustaría ver nuestros artículos más destacados mientras tanto?",
  "¡Qué buena pregunta! Lamentablemente no tengo una respuesta exacta para eso ahora mismo, pero aquí tienes lo más pedido por nuestra comunidad:"
];

const HELP_PROMPT = "Si necesitas ayuda con algo más, puedes preguntarme por nuestra **ubicación**, **horarios**, **métodos de pago** o simplemente decirme qué componente buscas. ¡Estoy para ayudarte! 😊";

// ==========================================
// 🤖 BOT ROUTE
// ==========================================
router.post('/message', async (req, res) => {
  const { message, lastProducts } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

  const msg = message.toLowerCase().trim();
  console.log(`[Chatbot Advanced] Msg: "${msg}"`);

  // --- 1. INTENT CLASSIFICATION (REGEX BASED) ---
  let intent = 'SEARCH';
  
  if (/\b(hola|buen(as|os)|dias|tardes|noches|saludos|que tal|como estas|quien sos)\b/.test(msg)) intent = 'GREETING';
  else if (/\b(donde|ubicacion|sucursal|direccion|local|rosario|donde queda)\b/.test(msg)) intent = 'LOCATION';
  else if (/\b(horario|cuando abren|atienden|cerrado|abierto|hora)\b/.test(msg)) intent = 'HOURS';
  else if (/\b(pago|efectivo|tarjeta|abonar|metodo|transferencia|compro|comprar)\b/.test(msg)) intent = 'PAYMENT';
  else if (/\b(envio|manda|domicilio|llega|entrega|reparto)\b/.test(msg)) intent = 'SHIPPING';
  else if (/\b(devolucion|garantia|falla|roto|cambio|devolver)\b/.test(msg)) intent = 'WARRANTY';
  else if (/\b(factura|ticket|boleta|comprobante)\b/.test(msg)) intent = 'INVOICE';
  else if (/\b(quien|dueño|fundador|ignacio|rodriguez|sobre|historia)\b/.test(msg)) intent = 'ABOUT';
  else if (/\b(tarda|tiempo|demora|cuanto)\b/.test(msg) && (msg.includes('pedido') || msg.includes('preparar'))) intent = 'PREP_TIME';
  else if (/\b(instagram|tiktok|redes|social|seguirlos)\b/.test(msg)) intent = 'SOCIAL';
  else if (/\b(limpiar|limpieza|pasta|mantenimiento|service|calienta|temperatura)\b/.test(msg)) intent = 'MAINTENANCE';
  else if (/\b(monitor|pantalla|hz|panel|ips|tn|va|4k)\b/.test(msg)) intent = 'MONITORS';
  else if (/\b(teclado|switch|red|blue|brown|mecanico)\b/.test(msg)) intent = 'KEYBOARDS';
  else if (/\b(mouse|raton|dpi|sensor|optico)\b/.test(msg)) intent = 'MICE';
  else if (/\b(combo|kit|actualizacion|bundle)\b/.test(msg)) intent = 'BUNDLES';
  else if (/\b(fuente|watts|certificada|80|bronze|gold|silver|platinum)\b/.test(msg)) intent = 'POWER_SUPPLY';
  else if (/\b(compatible|compatibilidad|sirve|calza|socket)\b/.test(msg)) intent = 'COMPATIBILITY';
  else if (/\b(agregar|carrito|sumar|llevo)\b/.test(msg)) intent = 'ADD_TO_CART';
  else if (/\b(recomenda|sugerime|cual es mejor|sirve para|gaming|jugar)\b/.test(msg)) intent = 'RECOMMEND';

  // --- 2. EXECUTE INTENT ---

  // Simple Text Responses
  if (intent === 'GREETING') return res.json({ type: 'text', message: GREETINGS[Math.floor(Math.random()*GREETINGS.length)], products: [] });
  if (intent === 'LOCATION') return res.json({ type: 'text', message: KNOWLEDGE_BASE.LOCATION, products: [] });
  if (intent === 'HOURS') return res.json({ type: 'text', message: KNOWLEDGE_BASE.HOURS, products: [] });
  if (intent === 'PAYMENT') return res.json({ type: 'text', message: KNOWLEDGE_BASE.PAYMENT, products: [] });
  if (intent === 'SHIPPING') return res.json({ type: 'text', message: KNOWLEDGE_BASE.SHIPPING, products: [] });
  if (intent === 'WARRANTY') return res.json({ type: 'text', message: `${KNOWLEDGE_BASE.WARRANTY}\n\n${KNOWLEDGE_BASE.RETURNS}`, products: [] });
  if (intent === 'INVOICE') return res.json({ type: 'text', message: KNOWLEDGE_BASE.INVOICE, products: [] });
  if (intent === 'ABOUT') return res.json({ type: 'text', message: KNOWLEDGE_BASE.ABOUT, products: [] });
  if (intent === 'PREP_TIME') return res.json({ type: 'text', message: KNOWLEDGE_BASE.PREP_TIME, products: [] });
  if (intent === 'SOCIAL') return res.json({ type: 'text', message: KNOWLEDGE_BASE.SOCIAL, products: [] });
  if (intent === 'MAINTENANCE') return res.json({ type: 'text', message: KNOWLEDGE_BASE.MAINTENANCE, products: [] });
  if (intent === 'MONITORS') return res.json({ type: 'text', message: KNOWLEDGE_BASE.MONITORS, products: [] });
  if (intent === 'KEYBOARDS') return res.json({ type: 'text', message: KNOWLEDGE_BASE.KEYBOARDS, products: [] });
  if (intent === 'MICE') return res.json({ type: 'text', message: KNOWLEDGE_BASE.MICE, products: [] });
  if (intent === 'BUNDLES') return res.json({ type: 'text', message: KNOWLEDGE_BASE.BUNDLES, products: [] });
  if (intent === 'POWER_SUPPLY') return res.json({ type: 'text', message: KNOWLEDGE_BASE.POWER_SUPPLY, products: [] });
  if (intent === 'COMPATIBILITY') return res.json({ type: 'text', message: KNOWLEDGE_BASE.COMPATIBILITY, products: [] });

  // ADD TO CART logic (Improved)
  if (intent === 'ADD_TO_CART') {
    let target = null;
    if (lastProducts?.length > 0) {
      const numMatch = msg.match(/\b([1-9]|10)\b/);
      if (numMatch) {
        const idx = parseInt(numMatch[0]) - 1;
        if (idx >= 0 && idx < lastProducts.length) target = lastProducts[idx];
      }
      if (!target) {
        target = lastProducts.find(p => msg.includes(p.name.toLowerCase().split(' ')[0]));
      }
    }
    if (target) {
      try { await axios.post(`http://localhost:${process.env.PORT || 5000}/api/cart/add`, { productId: target.id }); } catch (e) {}
      return res.json({
        type: 'cart_action',
        message: `✅ ¡Listo! He sumado **${target.name}** a tu carrito. ¿Quieres algo más?`,
        products: [],
        action: { type: "add_to_cart", productId: target.id, product: target }
      });
    }
    return res.json({ type: 'text', message: "Dime qué producto de la lista anterior quieres agregar (puedes decir el número).", products: [] });
  }

  // --- 3. SEARCH LOGIC (STRICT & RELEVANT) ---
  const normalize = (text) =>
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\b(busco|tenes|vendes|quiero|una|un|para|por|favor|recomenda|sugerime|mejor|sirve|jugar|gaming|productos|articulos|hola|che)\b/g, "")
      .trim();

  const keyword = normalize(msg);
  console.log(`[Chatbot] Keyword extracted: "${keyword}"`);

  try {
    if (!keyword) {
      return res.json({ 
        type: 'text', 
        message: "No entendí qué producto buscas. ¿Podrías ser más específico? Por ejemplo: 'Procesador Intel' o 'Placa de video RTX'.", 
        products: [] 
      });
    }

    const { Category } = require('../models');
    const dbProducts = await Product.findAll({
      where: {
        stock: { [Op.gt]: 0 },
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
          { '$Category.descripcion$': { [Op.like]: `%${keyword}%` } }
        ]
      },
      include: [{ model: Category, attributes: ['descripcion'] }],
      order: [
        ['stock', 'DESC'],
        ['price', 'ASC']
      ],
      limit: 4
    });

    if (dbProducts.length === 0) {
      return res.json({
        type: "text",
        message: "No encontré productos con stock para lo que buscás. ¿Querés que te recomiende algo similar?",
        products: []
      });
    }

    let responseMsg = `He encontrado estos ${dbProducts.length} productos para ti:`;
    if (intent === 'RECOMMEND') responseMsg = `🚀 Basado en lo que buscas, te recomiendo estos ${dbProducts.length} componentes:`;
    
    return res.json({ type: 'products', message: responseMsg, products: dbProducts });

  } catch (err) {
    console.error('Bot Database Error:', err);
    return res.json({ type: 'text', message: "Tengo un problema técnico al buscar en mi base de datos. ¡Prueba de nuevo en un momento!", products: [] });
  }
});

module.exports = router;
