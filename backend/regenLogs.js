const { LogMotorPrecio } = require('./models');
const { updatePrices } = require('./services/pricingEngine');

async function fix() {
  console.log('Cleaning up fake logs...');
  await LogMotorPrecio.destroy({ where: {} });
  console.log('Running the real pricing engine...');
  await updatePrices();
  console.log('Done.');
  process.exit(0);
}

fix().catch(console.error);
