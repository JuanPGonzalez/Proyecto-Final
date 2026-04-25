const express = require('express');
const router = express.Router();
const axios = require('axios');
const mlService = require('../services/mlService');

// Ruta para Login (Obtener CODE)
router.get('/login', (req, res) => {
  const url = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${process.env.ML_CLIENT_ID}&redirect_uri=${process.env.ML_REDIRECT_URI}`;
  res.redirect(url);
});

// Ruta Callback (Obtener ACCESS TOKEN y guardarlo en memoria)
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No se recibió authorization code de ML.');
  }

  try {
    const response = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ML_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    mlService.setTokenData(response.data);
    console.log('✅ TOKEN GUARDADO:', response.data);

    res.send('Autenticación exitosa. Se ha autorizado y el Access Token fue verificado.');
  } catch (error) {
    console.error('Error en OAuth:', error.response?.data || error.message);
    res.status(500).send('Error en OAuth');
  }
});

router.get('/test-item', async (req, res) => {
  try {
    const data = await mlService.fetchItemFromML('MLA2223414884');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /search deprecated - moved to frontend direct API

module.exports = router;
