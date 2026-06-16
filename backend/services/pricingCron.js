const cron = require('node-cron');
const { updatePrices } = require('./pricingEngine');

const startPricingCron = () => {
  // Ejecutar una vez al día a las 00:00 AM (Medianoche)
  cron.schedule('0 0 * * *', async () => {
    await updatePrices();
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
  
};

module.exports = startPricingCron;
