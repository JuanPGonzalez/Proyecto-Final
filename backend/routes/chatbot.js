const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { Op } = require('sequelize');
const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getRelatedCategory(productName) {
  const q = productName.toLowerCase();
  if (q.includes("rtx") || q.includes("rx") || q.includes("gpu") || q.includes("grafica") || q.includes("radeon") || q.includes("video")) return ["psu", "cpu", "gabinete", "fuente", "motherboard"];
  if (q.includes("ryzen") || q.includes("intel") || q.includes("cpu") || q.includes("core") || q.includes("procesador")) return ["motherboard", "ram", "mother", "memoria"];
  if (q.includes("ram") || q.includes("ddr") || q.includes("fury") || q.includes("memoria")) return ["cpu", "procesador", "ryzen", "intel"];
  if (q.includes("teclado") || q.includes("keyboard")) return ["mouse", "raton"];
  if (q.includes("mouse") || q.includes("raton")) return ["teclado", "pad"];
  return ["ram", "ssd"];
}

const HARDWARE_HAVEN_GUIDE = `
Help Center - Hardware Haven
FAQ
1. How can I place an order? Select products, add to cart, and follow checkout steps. You can generate an invoice and email it.
2. Shipping: No shipping offered currently. Contact us at 123456.
3. Track order: Proceed to nearest branch.
4. Returns: Within 30 days if compliant with policy.
5. Cancellations: Use "Purchases" option. Canceled orders won't show in history.
6. Invoices: Pickup at branch where payment is made and invoice issued.
7. About: Founded by Ignacio Rodríguez during the pandemic. Specializes in PC components.
8. Payment: Cash only at branch for now.
9. Hours: 6:00 AM - 11:59 AM & 4:00 PM - 10:00 PM, Tue-Fri.
10. Location: Zeballos 1315, Rosario.
11. Preparation time: 3 days.

NAVIGATION
- /home: Main landing.
- /productList: Browse catalog.
- /purchase: Checkout.
- /profile: Account management.
- /delivery: Pickup info.
- /inventory: Admin only.
- /chatbot: AI assistant.
- /help: Help Center.

SUPPORT
Email: HardwareHaven@gmail.com
`;

const INTERPRETER_SYSTEM_PROMPT = `You are the Expert Sales & Support Agent for Hardware Haven.
Your mission is to analyze user queries with high reasoning capability and provide structured instructions to the system.

CONTEXT:
${HARDWARE_HAVEN_GUIDE}

🧩 INTENTS
CONVERSATION → Greetings or small talk.
SEARCH_PRODUCT → Looking for hardware/components.
ADD_TO_CART → Wants to buy or add a specific item.
ASK_STOCK → Availability check.
ASK_BUSINESS → Hours, location, payment, shipping, help center info.
RECOMMENDATION → Seeking advice for a build or use case.
OTHER → General technical support or unrelated queries.

📦 OUTPUT FORMAT (STRICT JSON)
{
  "intent": "INTENT_NAME",
  "keywords": ["key", "words"],
  "productId": null,
  "requiresProducts": boolean,
  "reasoning": "Briefly explain why you chose this intent"
}

🧪 EXAMPLES:
User: "¿Donde queda el local?" 
-> {"intent": "ASK_BUSINESS", "keywords": ["local", "ubicacion"], "productId": null, "requiresProducts": false, "reasoning": "User is asking for the store location."}

User: "¿Cuales son los horarios de atencion?" 
-> {"intent": "ASK_BUSINESS", "keywords": ["horarios"], "productId": null, "requiresProducts": false, "reasoning": "User is asking for business hours."}

User: "Hola, ¿como estan?" 
-> {"intent": "CONVERSATION", "keywords": [], "productId": null, "requiresProducts": false, "reasoning": "General greeting."}

User: "¿Tenes placas de video RTX?" 
-> {"intent": "SEARCH_PRODUCT", "keywords": ["placas", "video", "rtx"], "productId": null, "requiresProducts": true, "reasoning": "User is searching for GPUs."}

📌 RULES
- Use ASK_BUSINESS for any info found in the FAQ/Guide (Hours, Location, Payment, About, Shipping).
- Set requiresProducts: true ONLY if the user needs to see a list of items.
- Be an efficient reasoning agent. Identify hidden needs.`;

router.post('/message', async (req, res) => {
  const { message, history, lastProducts, cartItems } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

  console.log(`[Chatbot] Recibido mensaje: "${message}"`);

  let aiData = null;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: INTERPRETER_SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const content = aiResponse.choices[0].message.content;    
    aiData = JSON.parse(content);

  } catch (err) {
    console.error('[Chatbot] OpenAI Interpreter Error:', err.message);
  }

  // Use structured AI output
  let intent = aiData?.intent || "SEARCH_PRODUCT";
  const productId = aiData?.productId || null;
  let requiresProducts = aiData?.requiresProducts ?? false;

  // Manual refinement for high-priority intents
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('sucursal') || lowerMsg.includes('horario') || lowerMsg.includes('donde esta') || lowerMsg.includes('donde queda') || lowerMsg.includes('atencion')) {
    intent = 'ASK_BUSINESS';
  }

  // Ensure ASK_BUSINESS and CONVERSATION don't show products unless explicitly requested
  if (['CONVERSATION', 'ASK_BUSINESS', 'OTHER'].includes(intent)) {
    requiresProducts = aiData?.requiresProducts || false;
  }

  // Extract keywords for search if needed
  const keywords = aiData?.keywords || message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(quiero|busco|necesito|un|una|para|recomendar|buscar|agregar)\b/gi, "")
    .split(" ")
    .filter(w => w.length > 2);

  console.log("[Chatbot] Final AI Interpretation: ", {
    intent,
    requiresProducts,
    keywords,
    reasoning: aiData?.reasoning
  });

  try {
    // ==========================================
    // 1. ADD TO CART FLOW
    // ==========================================
    if (intent === 'ADD_TO_CART') {
      // (Keep existing add to cart logic)
      let selectedProduct = null;
      
      if (lastProducts && lastProducts.length > 0) {
        if (productId !== null) {
          const index = parseInt(productId, 10) - 1;
          if (index >= 0 && index < lastProducts.length) {
            selectedProduct = lastProducts[index];
          }
        } 
        
        if (!selectedProduct && keywords.length > 0) {
          selectedProduct = lastProducts.find(p => {
             const lowerName = p.name.toLowerCase();
             return keywords.every(kw => lowerName.includes(kw));
          });
        }
        
        if (!selectedProduct) selectedProduct = lastProducts[0];
      }
      
      if (selectedProduct) {
        // Internal cart sync attempt
        try {
          await axios.post(`http://localhost:${process.env.PORT || 5000}/api/cart/add`, {
            productId: selectedProduct.id
          });
        } catch (e) { }

        // We only show related products IF specifically requested or for upsell, 
        // but user asked to NOT respond with suggested products for everything.
        // So for ADD_TO_CART, we just confirm.
        
        return res.json({
          type: 'cart_action',
          message: `✅ ¡Perfecto! He agregado **${selectedProduct.name}** a tu carrito.\n¿Deseas buscar algo más o ir a finalizar la compra?`,
          products: [], // Empty products to avoid "suggested products for every single thing"
          action: {
            type: "add_to_cart",
            productId: selectedProduct.id,
            product: selectedProduct
          }
        });
      } else {
        return res.json({
          type: 'text',
          message: 'No identifiqué el producto exacto para agregar. ¿Podrías decirme el nombre o el número de la lista?',
          products: []
        });
      }
    }

    // ==========================================
    // 2. PRODUCT SEARCH / RECOMMEND / STOCK FLOW
    // ==========================================
    if (requiresProducts || ['SEARCH_PRODUCT', 'RECOMMENDATION', 'ASK_STOCK'].includes(intent)) {
      let dbProducts = [];
      let whereClause = { stock: { [Op.gt]: 0 } };

      const validKeywords = keywords.filter(k => k.length > 1);

      if (validKeywords.length > 0) {
        whereClause[Op.and] = validKeywords.map(kw => ({
          [Op.or]: [
            { name: { [Op.like]: `%${kw}%` } },
            { description: { [Op.like]: `%${kw}%` } }
          ]
        }));
      }

      dbProducts = await Product.findAll({
        where: whereClause,
        limit: 10, // Increased limit
        raw: true
      });

      if (!dbProducts || dbProducts.length === 0) {
        if (validKeywords.length > 0) {
          const fallbackWhere = {
            [Op.or]: validKeywords.map(kw => ({
              [Op.or]: [
                { name: { [Op.like]: `%${kw}%` } },
                { description: { [Op.like]: `%${kw}%` } }
              ]
            }))
          };
          dbProducts = await Product.findAll({
            where: fallbackWhere,
            limit: 10,
            raw: true
          });
        }
      }

      // Final fallback to top products ONLY if searching but nothing found
      if ((!dbProducts || dbProducts.length === 0) && intent !== 'CONVERSATION') {
        dbProducts = await Product.findAll({
          order: [['views', 'DESC']],
          limit: 10,
          raw: true
        });
      }

      const safeProducts = Array.isArray(dbProducts) ? dbProducts : [];

      let genreply = '';
      if (intent === 'ASK_STOCK') genreply = `¡Verifiqué el stock! Estas son las opciones disponibles:`;
      else if (intent === 'RECOMMENDATION') genreply = `Basado en lo que buscas, te sugiero estos componentes:`;
      else genreply = `He encontrado estos productos para tu búsqueda:`;

      return res.json({
        type: safeProducts.length > 0 ? 'products' : 'text',
        message: safeProducts.length > 0 ? genreply : 'No encontré productos que coincidan exactamente con tu búsqueda en este momento.',
        products: safeProducts
      });
    }

    // ==========================================
    // 3. ASK BUSINESS / CONVERSATION / OTHER FLOW
    // ==========================================
    if (intent === 'ASK_BUSINESS' || intent === 'CONVERSATION' || intent === 'OTHER') {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `Eres el Asesor Experto de Hardware Haven.
          Responde la consulta del usuario basándote en esta información:
          ${HARDWARE_HAVEN_GUIDE}
          
          REGLAS:
          - Sé amable, profesional y conciso.
          - Responde en Español.
          - Si la info no está, sugiere contactar a HardwareHaven@gmail.com.
          - Agrega algún emoji pertinente.` },
          { role: "user", content: message }
        ],
        temperature: 0.7
      });

      return res.json({
        type: 'text',
        message: response.choices[0].message.content,
        products: []
      });
    }

    return res.json({
      type: 'text',
      message: 'No estoy seguro de haber entendido bien. ¿Buscás algún componente específico o ayuda con tu compra?',
      products: []
    });

  } catch (err) {
    console.error('Chatbot Server Error:', err);
    res.status(500).json({ type: 'text', message: 'Ocurrió un error procesando tu solicitud.', products: [] });
  }
});

module.exports = router;
