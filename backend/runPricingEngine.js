require('dotenv').config();
const { updatePrices } = require('./services/pricingEngine');

async function run() {
  console.log('Iniciando ejecución manual del motor de precios...');
  try {
    await updatePrices();
    console.log('Ejecución finalizada con éxito.');
  } catch (error) {
    console.error('Ocurrió un error al ejecutar el motor de precios:', error);
  } finally {
    process.exit(0);
  }
}

run();
