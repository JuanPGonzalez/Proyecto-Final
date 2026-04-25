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

const INTERPRETER_SYSTEM_PROMPT = `You are a Sales Assistant AI for a computer hardware e-commerce store.

Your role is STRICTLY LIMITED to:
✅ WHAT YOU MUST DO
Understand user intent
Extract structured data from the message
You must classify every user message into ONE of the following intents:

🧩 INTENTS
SEARCH_PRODUCT → user is looking for a product
ADD_TO_CART → user wants to add a product to cart
ASK_STOCK → user asks if a product is available
ASK_BUSINESS → user asks about store info (hours, payment, shipping, etc)
RECOMMENDATION → user asks what you suggest
OTHER → anything else

📦 OUTPUT FORMAT (STRICT JSON ONLY)
You MUST always return ONLY a valid JSON object:
{
  "intent": "SEARCH_PRODUCT",
  "keywords": ["rtx", "4090"],
  "productId": null
}

📌 FIELD RULES
intent: one of the predefined intents
keywords: array of relevant search terms (lowercase, no symbols)
productId: number if user refers to a specific product otherwise null

🧠 NORMALIZATION RULES
Convert everything to lowercase
Remove special characters
Extract only meaningful words
Map synonyms when possible:
grafica / placa -> gpu
procesador -> cpu
fuente -> psu

🧪 EXAMPLES
User: "tenes rtx 4090?"
{"intent": "ASK_STOCK", "keywords": ["rtx", "4090"], "productId": null}

User: "quiero una placa de video"
{"intent": "SEARCH_PRODUCT", "keywords": ["gpu"], "productId": null}

User: "agrega el producto 3"
{"intent": "ADD_TO_CART", "keywords": [], "productId": 3}

User: "hacen envios?"
{"intent": "ASK_BUSINESS", "keywords": ["envios"], "productId": null}

User: "que me recomendas para gaming?"
{"intent": "RECOMMENDATION", "keywords": ["gaming"], "productId": null}

⚠️ CRITICAL RULES
ALWAYS return JSON only (no text, no explanations)
NEVER break JSON format
NEVER add extra fields
NEVER assume product IDs
NEVER generate recommendations yourself

🧠 IMPORTANT
You are NOT the system.
You are ONLY the interpreter.
The backend will: search products, check stock, manage cart, generate recommendations.`;

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

  // Fallback Intent
  let intent = aiData?.intent || "SEARCH_PRODUCT";
  let productId = aiData?.productId || null;

  // Fallback Keyword Extraction (Critical)
  let keywords = [];
  if (aiData && Array.isArray(aiData.keywords) && aiData.keywords.length > 0) {
    keywords = aiData.keywords;
  } else {
    keywords = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\b(quiero|busco|necesito|un|una|para|recomendar|buscar|agregar)\b/gi, "") // Additional stop words to prevent 'necesito' failing exact match query
      .split(" ")
      .filter(w => w.length > 2);
  }

  // Debug Logs (Mandatory)
  console.log("[Chatbot] Final AI/Fallback Interpretation: ", {
    message,
    intent,
    keywords,
    productId
  });

  try {
    // ==========================================
    // 1. ADD TO CART FLOW & UPSELL
    // ==========================================
    if (intent === 'ADD_TO_CART') {
      let selectedProduct = null;
      
      if (lastProducts && lastProducts.length > 0) {
        if (productId !== null) {
          const index = parseInt(productId, 10) - 1;
          if (index >= 0 && index < lastProducts.length) {
            selectedProduct = lastProducts[index];
          }
        } 
        
        if (!selectedProduct && keywords.length > 0) {
          // Attempt string match using the keywords over lastProducts
          selectedProduct = lastProducts.find(p => {
             const lowerName = p.name.toLowerCase();
             return keywords.every(kw => lowerName.includes(kw));
          });
        }
        
        if (!selectedProduct) selectedProduct = lastProducts[0]; // Super fallback
      }
      
      if (selectedProduct) {
        try {
          await axios.post(`http://localhost:${process.env.PORT || 5000}/api/cart/add`, {
            productId: selectedProduct.id
          });
        } catch (e) {
          console.log('[Chatbot] Skip cart internal hook (isolated fail)', e.message);
        }

        const relatedTerms = getRelatedCategory(selectedProduct.name);

        let relatedDb = await Product.findAll({
          where: {
            stock: { [Op.gt]: 0 },
            id: { [Op.ne]: selectedProduct.id },
            [Op.or]: relatedTerms.map(t => ({ name: { [Op.like]: `%${t}%` } })).concat(
              relatedTerms.map(t => ({ description: { [Op.like]: `%${t}%` } }))
            )
          },
          limit: 3,
          raw: true
        });

        if (relatedDb.length === 0) {
          relatedDb = await Product.findAll({
            where: { id: { [Op.ne]: selectedProduct.id } },
            limit: 3,
            raw: true
          });
        }

        const replyMsg = `🔥 ¡Buenísima elección!\nHe preparado el componente *${selectedProduct.name}* para agregarlo a tu orden.\n\n` +
          (relatedDb.length > 0 ? `Te recomiendo complementar esto con los siguientes productos para armar un buen setup:` : `¿En qué más te puedo ayudar hoy?`);

        console.log("[Chatbot] Products returned:", relatedDb.length);

        return res.json({
          type: 'cart_action',
          message: replyMsg,
          products: Array.isArray(relatedDb) ? relatedDb : [],
          action: {
            type: "add_to_cart",
            productId: selectedProduct.id,
            product: selectedProduct
          }
        });
      } else {
        return res.json({
          type: 'text',
          message: 'No identifiqué el producto exacto para agregar. Por favor referéncialo por su número (ej. "el 1").',
          products: []
        });
      }
    }

    // ==========================================
    // 2. PRODUCT SEARCH / RECOMMEND / STOCK FLOW
    // ==========================================
    if (['SEARCH_PRODUCT', 'RECOMMENDATION', 'ASK_STOCK'].includes(intent)) {
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

      // DO NOT skip search if keywords exist
      dbProducts = await Product.findAll({
        where: whereClause,
        limit: 5,
        raw: true
      });
      console.log(`[Chatbot] Resultados búsqueda principal: ${dbProducts.length}`);

      if (!dbProducts || dbProducts.length === 0) {
        if (validKeywords.length > 0) {
           // Fallback Search 1: Loosen the query to ANY keyword matching (Op.or instead of Op.and)
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
            limit: 5,
            raw: true
          });
          console.log(`[Chatbot] Resultados fallback parcial (Ignorando Op.and): ${dbProducts.length}`);
        }
      }

      // DO NOT jump directly to "top products"
      // Only fallback if search result is truly empty (e.g. keywords didn't match absolutely anything, or there were no keywords)
      if (!dbProducts || dbProducts.length === 0) {
        dbProducts = await Product.findAll({
          order: [['views', 'DESC']],
          limit: 5,
          raw: true
        });
        console.log(`[Chatbot] Resultados super-fallback (top products): ${dbProducts.length}`);
      }

      const safeProducts = Array.isArray(dbProducts) ? dbProducts : [];
      console.log("[Chatbot] Products returned:", safeProducts.length);

      let genreply = '';
      if (intent === 'ASK_STOCK') genreply = `¡Verifiqué el catálogo para tu consulta! Estas son las unidades disponibles actualmente:`;
      else if (intent === 'RECOMMENDATION') genreply = `Basado en tu consulta, te sugiero considerar estas excelentes opciones:`;
      else genreply = `¡Aquí tienes las opciones que encontré para tu búsqueda!`;

      return res.json({
        type: 'products',
        message: safeProducts.length > 0 ? genreply : 'No se encontraron resultados exactos, pero aquí tienes algunos modelos populares:',
        products: safeProducts
      });
    }

    // ==========================================
    // 3. ASK BUSINESS FLOW
    // ==========================================
    if (intent === 'ASK_BUSINESS') {
      return res.json({
        type: 'text',
        message: '🏢 *Información sobre Hardware Haven:*\n\n• **Envíos:** Hacemos envíos a todo el país. \n• **Pagos:** Aceptamos todas las tarjetas de crédito, débito, y transferencias bancarias.\n• **Horarios:** Atendemos consultas de Lun. a Vie. de 09:00 a 18:00 hs.\n\n¿Buscas algún producto en particular?',
        products: []
      });
    }

    // ==========================================
    // 4. OTHER / GENERAL FALLBACK
    // ==========================================
    return res.json({
      type: 'text',
      message: '¡Hola! ¿En qué te puedo ayudar hoy? Podés preguntarme por disponibilidad de stock, buscar recomendaciones de piezas, o simplemente pedir un producto para agregar al carrito.',
      products: []
    });

  } catch (err) {
    console.error('Chatbot Server Error:', err);
    res.status(500).json({ type: 'text', message: 'Ocurrió un error en la base de datos.', products: [] });
  }
});

module.exports = router;
