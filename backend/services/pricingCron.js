const cron = require('node-cron');
const { updatePrices } = require('./pricingEngine');

const startPricingCron = () => {
  // Ejecutar una vez al día a las 03:00 AM
  cron.schedule('0 3 * * *', async () => {
    await updatePrices();
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
  
};

module.exports = startPricingCron;
