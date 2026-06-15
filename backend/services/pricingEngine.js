const { Op } = require('sequelize');
const { Product, LogMotorPrecio, Order, OrderItem } = require('../models');
const Anthropic = require('@anthropic-ai/sdk');

let anthropicClient = null;
const apiKey = process.env.ANTHROPIC_API_KEY;
if (apiKey) {
  anthropicClient = new Anthropic({ apiKey });
}

async function updatePrices() {
  console.log('[PricingEngine] Starting Claude AI price adjustment cycle...');
  
  if (!anthropicClient) {
    console.warn('[PricingEngine] No ANTHROPIC_API_KEY found. Skipping AI pricing cycle.');
    return;
  }

  try {
    const products = await Product.findAll({ where: { isActive: true } });
    if (products.length === 0) return;

    // Calcular fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Preparar el array de datos
    const productDataList = [];

    for (const product of products) {
      const recentSalesItems = await OrderItem.findAll({
        where: { componente_id: product.id },
        include: [{
          model: Order,
          where: { fecha_compra: { [Op.gte]: sevenDaysAgo } }
        }]
      });
      const recentSales = recentSalesItems.reduce((acc, item) => acc + item.quantity, 0);

      productDataList.push({
        id: product.id,
        name: product.name,
        current_price: Number(product.price),
        min_price: Number(product.precio_min) || Number(product.price) * 0.8,
        max_price: Number(product.precio_max) || Number(product.price) * 1.5,
        stock: product.stock,
        views: product.views || 0,
        recent_sales_7d: recentSales
      });
    }

    // Batching (chunks of 25 productos para no saturar a Claude)
    const chunkSize = 25;
    for (let i = 0; i < productDataList.length; i += chunkSize) {
      const chunk = productDataList.slice(i, i + chunkSize);
      console.log(`[PricingEngine] Analyzing batch ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(productDataList.length/chunkSize)}...`);

      const promptMsg = `Eres un Analista de Precios y Demanda de una tienda de hardware. 
Analiza los siguientes productos y determina un nuevo precio para cada uno basándote en la ley de oferta y demanda.
Si las vistas y ventas son altas y el stock bajo, sugiere subir el precio. Si no hay ventas y hay mucho stock, sugiere bajarlo. Las variaciones deben ser realistas (entre -5% y +5%).
DEBES respetar estrictamente los limites de min_price y max_price.

Datos de los productos (JSON):
${JSON.stringify(chunk, null, 2)}

Devuelve ÚNICAMENTE un array JSON válido con este formato, sin texto adicional (es crucial que sea un array JSON):
[
  {
    "id": 1,
    "new_price": 10500,
    "reason": "Sube 5% por alta demanda y bajo stock"
  }
]`;

      try {
        const response = await anthropicClient.messages.create({
          model: "claude-haiku-4-5", // Haiku: rápido y económico
          max_tokens: 2500,
          temperature: 0.2,
          system: "Eres una API que solo devuelve JSON válido. No uses markdown, no digas 'Aquí tienes'. Devuelve EXCLUSIVAMENTE el array JSON.",
          messages: [
            { role: "user", content: promptMsg }
          ]
        });

        let responseText = response.content[0].text.trim();
        // Limpiar posible markdown
        if (responseText.startsWith("```json")) {
          responseText = responseText.substring(7);
        } else if (responseText.startsWith("```")) {
          responseText = responseText.substring(3);
        }
        if (responseText.endsWith("```")) {
          responseText = responseText.substring(0, responseText.length - 3);
        }

        const adjustments = JSON.parse(responseText.trim());

        // Aplicar ajustes a la BD
        for (const adj of adjustments) {
          const product = await Product.findByPk(adj.id);
          if (!product) continue;

          let newPrice = Number(adj.new_price);
          const currentPrice = Number(product.price);
          const minP = Number(product.precio_min) || currentPrice * 0.8;
          const maxP = Number(product.precio_max) || currentPrice * 1.5;

          // Safeguards de backend
          if (newPrice < minP) newPrice = minP;
          if (newPrice > maxP) newPrice = maxP;

          // Solo actualizamos si la diferencia de precio es de al menos 1% (para no generar ruido)
          if (Math.abs(newPrice - currentPrice) / currentPrice >= 0.01) {
            await product.update({ price: newPrice });
            
            if (LogMotorPrecio) {
              await LogMotorPrecio.create({
                componente_id: product.id,
                precio_anterior: currentPrice,
                precio_nuevo: newPrice,
                detalle: adj.reason || "Ajuste dinámico sugerido por IA"
              });
            }
          }
        }
      } catch (err) {
        console.error(`[PricingEngine] Error analyzing batch:`, err.message);
      }
    }

    console.log('[PricingEngine] Claude AI cycle completed.');
  } catch (error) {
    console.error('[PricingEngine] Error in AI cycle:', error);
  }
}

module.exports = { updatePrices };
