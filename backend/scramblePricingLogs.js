const { Product, LogMotorPrecio } = require('./models');

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
  try {
    // Clear existing logs
    await LogMotorPrecio.destroy({ where: {} });

    const products = await Product.findAll();
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    console.log(`Generating logs for ${products.length} products...`);

    const origens = ['motor', 'motor', 'motor', 'manual', 'masivo'];
    const motivosMotorBaja = ["La demanda del producto cayó un 15%", "El precio de competencia bajó $500", "Ajuste para rotación rápida de stock bajo"];
    const motivosMotorSube = ["Alta demanda detectada (+20%)", "Bajo stock y alta demanda", "Ajuste a inflación del sector (+3%)"];

    for (const product of products) {
      // 3 to 7 logs per product
      const numLogs = Math.floor(Math.random() * 5) + 3;
      
      let currentMockPrice = Number(product.price) * (0.8 + Math.random() * 0.4); // Start somewhere around current price
      currentMockPrice = Math.round(currentMockPrice);

      let logDates = [];
      for (let i = 0; i < numLogs; i++) {
        logDates.push(getRandomDate(threeMonthsAgo, now));
      }
      // Sort dates chronically
      logDates.sort((a, b) => a - b);

      for (let i = 0; i < numLogs; i++) {
        const origen = origens[Math.floor(Math.random() * origens.length)];
        const isUp = Math.random() > 0.5;
        const variation = currentMockPrice * (0.02 + Math.random() * 0.08); // 2% to 10% change
        
        let newPrice = isUp ? currentMockPrice + variation : currentMockPrice - variation;
        newPrice = Math.round(newPrice);

        // Si es el último log, que termine en el precio real actual del producto
        if (i === numLogs - 1) {
          newPrice = Number(product.price);
        }

        let detalle = '';
        if (origen === 'motor') {
          detalle = newPrice > currentMockPrice ? 
            motivosMotorSube[Math.floor(Math.random() * motivosMotorSube.length)] : 
            motivosMotorBaja[Math.floor(Math.random() * motivosMotorBaja.length)];
        } else if (origen === 'manual') {
          detalle = "Actualización Manual de Administrador";
        } else if (origen === 'masivo') {
          detalle = "Carga Masiva de Precios (Excel) o Ajuste General";
        }

        await LogMotorPrecio.create({
          componente_id: product.id,
          precio_anterior: currentMockPrice,
          precio_nuevo: newPrice,
          detalle: detalle,
          origen: origen,
          estado: 'success',
          created_at: logDates[i]
        });

        currentMockPrice = newPrice;
      }
    }

    console.log('Done generating pricing logs!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating logs:', error);
    process.exit(1);
  }
}

run();
