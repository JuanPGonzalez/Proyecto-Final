const cron = require('node-cron');
const { Product } = require('../models');

const startPricingCron = () => {
  // Configured to run every 5 minutes for demo purposes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Ejecutando ajuste automático de precios...');
    try {
      const products = await Product.findAll();
      for (const product of products) {
        // Simulamos un cambio de precio dinámico basado en las vistas
        let modifier = 1.0;
        let views = Number(product.views || 0);
        if (views > 100) {
          modifier = 1.05; // 5% de aumento si es muy popular
        } else if (views === 0) {
          modifier = 0.95; // 5% de descuento si no tiene vistas
        }
        
        let currentPrice = Number(product.price || 0) || 1000;
        const newPrice = (currentPrice * modifier).toFixed(2);
        
        if (Number(newPrice) !== currentPrice && currentPrice !== 0) {
          product.price = newPrice;
          await product.save();
          console.log(`[Cron] Precio actualizado para ${product.name}: $${newPrice}`);
        }
      }
    } catch (error) {
      console.error('[Cron] Error ajustando precios:', error);
    }
  });
};

module.exports = startPricingCron;
