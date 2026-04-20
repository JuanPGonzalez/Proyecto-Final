const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// Endpoint del chatbot
router.post('/message', async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

  const query = message.toLowerCase();

  try {
    // Lógica de IA Simulada
    if (query.includes('recomienda') || query.includes('recomendar')) {
      const topProduct = await Product.findOne({ order: [['views', 'DESC']] });
      return res.json({ response: `¡Claro! Te recomiendo el ${topProduct.name} que está a $${topProduct.price}. Es uno de nuestros productos más populares.` });
    }
    
    if (query.includes('precio') || query.includes('cuanto cuesta')) {
      const products = await Product.findAll();
      // Buscamos coincidencia en el nombre
      const found = products.find(p => query.includes(p.name.toLowerCase()));
      if (found) {
        return res.json({ response: `El precio del ${found.name} es $${found.price}.` });
      } else {
        return res.json({ response: `Puedes revisar nuestro catálogo completo en la página principal para ver todos los precios.` });
      }
    }

    if (query.includes('hola') || query.includes('saludos')) {
      return res.json({ response: "¡Hola! Soy el asistente de Hardware Haven. ¿En qué puedo ayudarte hoy?" });
    }

    return res.json({ response: "Actualmente soy un asistente en fase Beta. Puedo recomendarte productos o decirte el precio de algún artículo en específico." });
  } catch(err) {
    res.status(500).json({ error: 'Error en el chatbot' });
  }
});

module.exports = router;
