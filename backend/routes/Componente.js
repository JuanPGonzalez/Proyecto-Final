const express = require('express');
const router = express.Router();
const { Product, ComponenteML } = require('../models');



// POST /api/componentes/:id/ml-mapping
// Save MercadoLibre IDs and fetches prices via authenticated endpoint
// CRITICAL: NUNCA sobrescribir price/title con NULL
router.post('/:id/ml-mapping', async (req, res) => {
  try {
    const { id } = req.params;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids inválidos' });
    }

    const { fetchItemFromML } = require('../services/mlService');
    const results = [];

    for (const ml_id of ids) {
      const item = await fetchItemFromML(ml_id);

      const [instance, created] = await ComponenteML.upsert({
        componente_id: Number(id),
        ml_id,
        price: item?.price || null,
        title: item?.title || null
      });

      results.push({ ml_id, created: created !== false });
    }

    res.json({ ok: true, results });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error guardando mapping');
  }
});

// GET /api/componentes/:id/ml-mapping
// Obtener IDs
router.get('/:id/ml-mapping', async (req, res) => {
  try {
    const { id } = req.params;

    const items = await ComponenteML.findAll({
      where: { componente_id: id }
    });

    res.json(items);
  } catch (error) {
    res.status(500).send('Error fetching mapping');
  }
});

module.exports = router;