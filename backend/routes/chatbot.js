const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { getCompatibleProducts } = require('../services/compatibilityService');

// ==========================================
// 🤖 CLAUDE AI INTEGRATION
// ==========================================
let anthropicClient = null;
try {
  const Anthropic = require('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    anthropicClient = new Anthropic({ apiKey });
    console.log('[Chatbot] Claude AI conectado exitosamente.');
  } else {
    console.warn('[Chatbot] ANTHROPIC_API_KEY no configurada. El chatbot usará solo respuestas locales.');
  }
} catch (err) {
  console.warn('[Chatbot] No se pudo inicializar Claude:', err.message);
}

// ==========================================
// 🧠 KNOWLEDGE BASE & CONFIG
// ==========================================
const SYSTEM_PROMPT = `Eres el asistente virtual IA exclusivo de **Hardware Haven**, la tienda líder en hardware y componentes informáticos para gaming, diseño y productividad, ubicada en Rosario, Argentina.

🎯 TU ROL:
Eres un experto en hardware apasionado por el gaming y el armado de PCs. Tu objetivo es interpretar la intención del usuario y responder de manera óptima utilizando SIEMPRE la herramienta que tienes disponible (respond_to_user). 

🏢 INFORMACIÓN DE LA TIENDA:
- Ubicación: Zeballos 1315, Rosario, Santa Fe, Argentina.
- Horarios: Martes a Viernes. Mañana: 06:00 AM a 11:59 AM. Tarde: 04:00 PM a 10:00 PM. (Sábados, Domingos y Lunes cerrado).
- Métodos de pago: Efectivo (solo para retiro en el local), Transferencia Bancaria, y Tarjetas.
- Envíos: Envíos a domicilio a todo el país o retiro gratis en nuestro local.
- Garantía: Oficial del fabricante.
- Cambios/Devoluciones: 30 días corridos.

📋 REGLAS DE COMPORTAMIENTO:
1. Idioma: Responde SIEMPRE en español de Argentina (usa "vos", "comprás", "tenés"). Sé amigable y muy profesional.
2. Longitud: Limita tu mensaje a 2-4 oraciones como máximo para no saturar el chat.
3. Mostrar Productos: SIEMPRE que el cliente pregunte por un producto que exista en el catálogo, DEBES usar type="products" y enviar sus IDs (máximo 4). 
4. Redirección: Si el cliente quiere armar una pc/presupuesto (type="redirect", url="/presupuestador"). Si quiere reportar un fallo, queja o hablar con soporte (type="redirect", url="/soporte").
5. Stock y Precios: Revisa siempre el catálogo provisto abajo. Si un producto no está o tiene stock 0, diles que no hay stock e invítales a ver otros similares.`;

// ==========================================
// 🤖 ASK CLAUDE LOGIC (TOOLS)
// ==========================================
async function askClaudeWithTools(userMessage) {
  if (!anthropicClient) return null;
  
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      include: [{ model: Category, attributes: ['descripcion'] }],
      attributes: ['id', 'name', 'price', 'stock', 'description']
    });
    
    let catalogText = "\n\n📦 CATÁLOGO ACTUAL Y STOCK EN TIEMPO REAL:\n";
    if (products.length > 0) {
      catalogText += products.map(p => `ID: ${p.id} | Cat: ${p.Category?.descripcion || 'Gen'} | Nom: ${p.name} | Precio: $${p.price} | Stock: ${p.stock}`).join('\n');
    } else {
      catalogText += "No hay productos en la base de datos actualmente.";
    }

    const dynamicSystemPrompt = SYSTEM_PROMPT + catalogText;

    const tools = [
      {
        name: "respond_to_user",
        description: "Determina cómo responder al usuario en la interfaz gráfica. DEBES usar esta herramienta para dar tu respuesta final.",
        input_schema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["text", "products", "redirect"],
              description: "El tipo de respuesta. Usa 'text' para charla normal o consultas. Usa 'products' para mostrar/recomendar artículos del catálogo inyectado. Usa 'redirect' para enviar al usuario a otra URL (ej: /presupuestador, /soporte, /perfil, /productos)."
            },
            message: {
              type: "string",
              description: "El texto en español de Argentina que leerá el usuario."
            },
            product_ids: {
              type: "array",
              items: { type: "integer" },
              description: "Si type es 'products', un array con los IDs numéricos de los productos a mostrar (ej: [12, 14]). Revisa que existan y tengan stock en el catálogo."
            },
            redirect_url: {
              type: "string",
              description: "Si type es 'redirect', la URL a redirigir (ej: '/presupuestador', '/soporte')."
            }
          },
          required: ["type", "message"]
        }
      }
    ];

    const msg = await anthropicClient.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: dynamicSystemPrompt,
      tools: tools,
      tool_choice: { type: "tool", name: "respond_to_user" },
      messages: [
        { role: "user", content: userMessage }
      ]
    });
    
    if (msg.content && msg.content[0].type === 'tool_use') {
      return msg.content[0].input;
    }
    
    return null;
  } catch (err) {
    console.error('[Chatbot] Claude Tool error:', err);
    return null;
  }
}

// ==========================================
// 🤖 BOT ROUTE
// ==========================================
router.post('/message', async (req, res) => {
  const { message, lastProducts, intent: clientIntent, productId: clientProductId, cartItems = [] } = req.body;
  
  // 1. UI INTENT OVERRIDES (Direct Logic)
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

  if (clientIntent === 'add_to_cart' && clientProductId) {
    try {
      const product = await Product.findByPk(clientProductId);
      if (!product) return res.json({ type: 'text', message: "No encontré el producto para agregar." });

      if (Number(product.stock) <= 0) {
        return res.json({ 
          type: 'text', 
          message: `❌ Lo siento, **${product.name}** no tiene stock disponible en este momento. ¿Querés que te recomiende alternativas?` 
        });
      }

      const updatedCart = [...cartItems, product];
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

  // 2. SMART ROUTING WITH CLAUDE TOOLS
  if (anthropicClient) {
    const claudeDecision = await askClaudeWithTools(message);
    
    if (claudeDecision) {
      const { type, message: claudeMessage, product_ids, redirect_url } = claudeDecision;
      
      if (type === 'products' && product_ids && product_ids.length > 0) {
        const foundProducts = await Product.findAll({
          where: { 
            id: { [Op.in]: product_ids },
            isActive: true,
            stock: { [Op.gt]: 0 }
          },
          include: [{ model: Category, attributes: ['descripcion'] }]
        });
        
        return res.json({
          type: 'products',
          message: claudeMessage,
          products: foundProducts.map(p => ({
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
      
      if (type === 'redirect' && redirect_url) {
        return res.json({
          type: 'redirect',
          message: claudeMessage,
          url: redirect_url
        });
      }
      
      // Default / Text fallback
      return res.json({ type: 'text', message: claudeMessage });
    }
  }

  // 3. FINAL FALLBACK (If Claude is unavailable or fails)
  return res.json({ type: 'text', message: "Lo siento, tuve un problema técnico procesando tu solicitud. Por favor intenta de nuevo." });
});

module.exports = router;
