const { Product, LogMotorPrecio } = require('../models');

async function updatePrices() {
  console.log('[PricingEngine] Starting price adjustment cycle...');
  try {
    const products = await Product.findAll();
    if (products.length === 0) return;

    const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
    const avgViews = totalViews / products.length;

    for (const product of products) {
      let currentPrice = Number(product.price);
      let basePrice = Number(product.base_price) || currentPrice * 0.9;
      let newPrice = currentPrice;

      // Logic: Demand-based fluctuation
      const views = product.views || 0;
      
      if (views > avgViews * 1.5) {
        // High demand: increase price by 1-3%
        newPrice *= (1 + (Math.random() * 0.02 + 0.01));
      } else if (views < avgViews * 0.5) {
        // Low demand: decrease price by 1-2%
        newPrice *= (1 - (Math.random() * 0.01 + 0.01));
      } else {
        // Stable: slight random fluctuation (internet trend simulation)
        newPrice *= (1 + (Math.random() * 0.01 - 0.005));
      }

      // Safeguard: Never below base price
      if (newPrice < basePrice) newPrice = basePrice;

      // Update if significantly changed (> 0.5%)
      if (Math.abs(newPrice - currentPrice) / currentPrice > 0.005) {
        await product.update({ price: newPrice });
        
        // Log the change
        if (LogMotorPrecio) {
          await LogMotorPrecio.create({
            componente_id: product.id,
            precio_anterior: currentPrice,
            precio_nuevo: newPrice,
            motivo: 'Ajuste automático por demanda'
          });
        }
      }
    }
    console.log('[PricingEngine] Cycle completed.');
  } catch (error) {
    console.error('[PricingEngine] Error updating prices:', error);
  }
}

module.exports = { updatePrices };
