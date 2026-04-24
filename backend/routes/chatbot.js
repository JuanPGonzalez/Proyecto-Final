const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const OpenAI = require('openai');

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint del chatbot
router.post('/message', async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

  try {
    // 1. Obtener contexto de productos actuales
    const products = await Product.findAll({ raw: true });
    const productContext = products.map(p => 
      `- ${p.name}: $${p.price} (Stock: ${p.stock}). Descripción: ${p.description.substring(0, 100)}...`
    ).join('\n');

    const systemPrompt = `
      Eres el asistente inteligente de "Hardware Haven", una tienda premium de componentes de PC en Argentina.
      Tu objetivo es ayudar a los clientes a elegir los mejores componentes para sus armados.
      
      CONTEXTO DE LA TIENDA (PRODUCTOS ACTUALES):
      ${productContext}
      
      REGLAS:
      1. Sé amable, profesional y experto en hardware.
      2. Si el cliente pregunta por algo que NO tenemos, intenta recomendar lo más parecido de nuestra lista.
      3. Habla en español rioplatense (voseo), pero mantén la elegancia.
      4. Si preguntan por precios, dales el precio exacto que figura en el contexto.
      5. Si te piden un presupuesto, intenta combinar productos de nuestra lista.
      6. No menciones que eres una IA a menos que te lo pregunten.
      
      Responde de forma concisa pero útil.
    `;

    // 2. Preparar mensajes para OpenAI (formato chat)
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.parts[0].text // Ajuste al formato anterior si es necesario
      })),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;

    return res.json({ reply });
  } catch(err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ reply: 'Lo siento, mi conexión con el núcleo de IA falló. ¿Podrías intentar de nuevo?' });
  }
});

module.exports = router;
