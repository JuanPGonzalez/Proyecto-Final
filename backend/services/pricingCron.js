const cron = require('node-cron');
const { updatePrices } = require('./pricingEngine');

const startPricingCron = () => {
  // Ejecutar cada hora
  cron.schedule('0 * * * *', async () => {
    await updatePrices();
  });
  
  // Ejecutar una vez al inicio para verificar
  setTimeout(async () => {
    await updatePrices();
  }, 5000);
};

module.exports = startPricingCron;
