const { Op } = require('sequelize');
const { Product, LogMotorPrecio, Order, OrderItem } = require('../models');

async function updatePrices() {
  console.log('[PricingEngine] Starting advanced price adjustment cycle...');
  try {
    const products = await Product.findAll();
    if (products.length === 0) return;

    const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
    const avgViews = totalViews / products.length;

    // Calcular fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const product of products) {
      let currentPrice = Number(product.price);
      let basePrice = Number(product.base_price) || currentPrice * 0.9;
      let newPrice = currentPrice;
      let demandScore = 0;
      let motivos = [];

      // Factor 1: Vistas
      const views = product.views || 0;
      if (views > avgViews * 1.5) {
        demandScore += 1;
        motivos.push('Alta demanda de visitas');
      } else if (views < avgViews * 0.5) {
        demandScore -= 1;
        motivos.push('Baja demanda de visitas');
      }

      // Factor 2: Ventas recientes (Últimos 7 días)
      const recentSalesItems = await OrderItem.findAll({
        where: { componente_id: product.id },
        include: [{
          model: Order,
          where: { fecha_compra: { [Op.gte]: sevenDaysAgo } }
        }]
      });
      const recentSales = recentSalesItems.reduce((acc, item) => acc + item.quantity, 0);

      if (recentSales > 5) {
        demandScore += 2;
        motivos.push('Alta rotación de ventas');
      } else if (recentSales === 0 && views > avgViews) {
        demandScore -= 2;
        motivos.push('Cero conversión (muchas vistas, cero ventas)');
      } else if (recentSales === 0) {
        demandScore -= 1;
      }

      // Factor 3: Stock
      const stock = product.stock || 0;
      if (stock > 0 && stock <= 5) {
        demandScore += 1;
        motivos.push('Escasez de stock');
      } else if (stock > 50) {
        demandScore -= 1;
        motivos.push('Sobre-stock');
      }

      // Decisión Final
      if (demandScore >= 2) {
        // Subida de precio (1% a 3%)
        newPrice *= (1 + (Math.random() * 0.02 + 0.01));
      } else if (demandScore <= -2) {
        // Bajada de precio (1% a 2%)
        newPrice *= (1 - (Math.random() * 0.01 + 0.01));
      } else {
        // Estable: fluctuación -0.5 a 0.5%
        newPrice *= (1 + (Math.random() * 0.01 - 0.005));
      }

      // Safeguard: Bounds
      if (newPrice < basePrice) newPrice = basePrice;
      if (product.precio_min && newPrice < product.precio_min) newPrice = product.precio_min;
      if (product.precio_max && newPrice > product.precio_max) newPrice = product.precio_max;

      // Update if significantly changed (> 0.5%)
      if (Math.abs(newPrice - currentPrice) / currentPrice > 0.005) {
        await product.update({ price: newPrice });
        
        let motivoFinal = 'Fluctuación normal de mercado';
        if (demandScore >= 2) motivoFinal = 'Alza por: ' + motivos.join(', ');
        else if (demandScore <= -2) motivoFinal = 'Baja por: ' + motivos.join(', ');
        else if (motivos.length > 0) motivoFinal = 'Ajuste leve por: ' + motivos.join(', ');

        if (motivoFinal.length > 250) motivoFinal = motivoFinal.substring(0, 250) + '...';

        if (LogMotorPrecio) {
          await LogMotorPrecio.create({
            componente_id: product.id,
            precio_anterior: currentPrice,
            precio_nuevo: newPrice,
            detalle: motivoFinal
          });
        }
      }
    }
    console.log('[PricingEngine] Advanced cycle completed.');
  } catch (error) {
    console.error('[PricingEngine] Error updating prices:', error);
  }
}

module.exports = { updatePrices };
