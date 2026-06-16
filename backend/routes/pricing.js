const express = require('express');
const router = express.Router();
const {
  getRobustMarketPrice,
  getMarketPriceByComponenteId,
  calculateSuggestedPrice
} = require('../services/pricingService');
const { ComponenteML, Product, LogMotorPrecio } = require('../models');

/**
 * GET /api/pricing/test
 * Test the robust market price calculation with hardcoded real ML IDs
 */
router.get('/test', async (req, res) => {
  try {
    // Real MercadoLibre item IDs for testing
    const testIds = [
      'MLA1617800563',
      'MLA1339807170',
      'MLA1677927445'
    ];

    console.log('[Pricing] Testing with IDs:', testIds);

    const result = await getRobustMarketPrice(testIds);

    // Example suggested price calculation
    const suggestedPricing = calculateSuggestedPrice(result.average, 120000, {
      minMarginPercentage: 5,
      maxDiscountPercentage: 15
    });

    res.json({
      ...result,
      suggestedPricing
    });
  } catch (error) {
    console.error('[Pricing] Test endpoint error:', error);
    res.status(500).json({
      error: 'Error calculating market price',
      details: error.message
    });
  }
});

/**
 * GET /api/pricing/componente/:id
 * Get market price for a specific componente
 */
router.get('/componente/:id', async (req, res) => {
  try {
    const componenteId = req.params.id;

    if (!componenteId || isNaN(componenteId)) {
      return res.status(400).json({ error: 'Invalid componente ID' });
    }

    // Get ML IDs for this componente
    const mlMappings = await ComponenteML.findAll({
      where: { componente_id: componenteId },
      raw: true
    });

    if (mlMappings.length === 0) {
      return res.json({
        componenteId,
        error: 'No ML IDs mapped for this componente',
        prices: [],
        median: 0,
        filteredPrices: [],
        average: 0,
        success: false
      });
    }

    const cachedPrices = mlMappings.map(m => m.price).filter(p => p !== null && p > 0);
    const result = await getRobustMarketPrice(cachedPrices);

    // Get current product info
    const producto = await Product.findByPk(componenteId);
    const currentPrice = producto ? producto.price : null;

    // Calculate suggested price
    const suggestedPricing = result.success
      ? calculateSuggestedPrice(result.average, currentPrice, {
          minMarginPercentage: 5,
          maxDiscountPercentage: 15
        })
      : null;

    res.json({
      componenteId,
      componente_name: producto?.name,
      current_price: currentPrice,
      ml_ids: mlMappings.map(m => m.ml_id),
      ...result,
      suggestedPricing
    });
  } catch (error) {
    console.error('[Pricing] Componente pricing error:', error);
    res.status(500).json({
      error: 'Error calculating componente price',
      details: error.message
    });
  }
});

/**
 * POST /api/pricing/calculate
 * Calculate market price for array of cached prices directly
 * Body: { prices: [1000, 1200, 1300] }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'prices must be a non-empty array of numbers'
      });
    }

    const result = await getRobustMarketPrice(prices);

    // Calculate suggested price
    const suggestedPricing = result.success
      ? calculateSuggestedPrice(result.average, 0, {
          minMarginPercentage: 5,
          maxDiscountPercentage: 15
        })
      : null;

    res.json({
      ...result,
      suggestedPricing
    });
  } catch (error) {
    console.error('[Pricing] Calculate pricing error:', error);
    res.status(500).json({
      error: 'Error calculating market price',
      details: error.message
    });
  }
});

const { updatePrices } = require('../services/pricingEngine');

/**
 * POST /api/pricing/run-engine
 * Manually trigger the global pricing update engine
 */
router.post('/run-engine', async (req, res) => {
  try {
    console.log('[Pricing] Manual execution of pricing engine requested');
    // Start background process
    updatePrices().catch(err => console.error('[Pricing] Background execution failed:', err));
    
    res.json({
      success: true,
      message: 'Motor de precios iniciado en segundo plano. Esto puede demorar varios minutos.'
    });
  } catch (error) {
    console.error('[Pricing] Run engine error:', error);
    res.status(500).json({
      error: 'Error iniciando motor de precios',
      details: error.message
    });
  }
});

/**
 * GET /api/pricing/logs/:componenteId
 * Get pricing logs for a componente
 */
router.get('/logs/:componenteId', async (req, res) => {
  try {
    const { componenteId } = req.params;

    if (!componenteId || isNaN(componenteId)) {
      return res.status(400).json({ error: 'Invalid componente ID' });
    }

    const logs = await LogMotorPrecio.findAll({
      where: { componente_id: componenteId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      componenteId,
      total: logs.length,
      logs
    });
  } catch (error) {
    console.error('[Pricing] Logs error:', error);
    res.status(500).json({
      error: 'Error fetching pricing logs',
      details: error.message
    });
  }
});

module.exports = router;
