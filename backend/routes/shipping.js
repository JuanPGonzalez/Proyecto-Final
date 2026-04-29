const express = require('express');
const router = express.Router();
const { Province, Locality } = require('../models');

// GET /api/shipping/provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await Province.findAll({ order: [['nombre', 'ASC']] });
    res.json({
      ok: true,
      provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ ok: false, error: 'Error al cargar provincias' });
  }
});

// GET /api/shipping/localidades/:provinciaId
router.get('/localidades/:provinciaId', async (req, res) => {
  try {
    const { provinciaId } = req.params;
    const localidades = await Locality.findAll({
      where: { provincia_id: provinciaId },
      order: [['nombre', 'ASC']]
    });
    res.json({
      ok: true,
      localidades
    });
  } catch (error) {
    console.error('Error fetching localities:', error);
    res.status(500).json({ ok: false, error: 'Error al cargar localidades' });
  }
});

module.exports = router;
