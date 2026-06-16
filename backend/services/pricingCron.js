const cron = require('node-cron');
const { updatePrices } = require('./pricingEngine');
const { getSettings } = require('./settingsService');

const startPricingCron = () => {
  // Ejecutar una vez al día a las 00:00 AM (Medianoche)
  cron.schedule('0 0 * * *', async () => {
    const settings = getSettings();
    if (!settings.pricingEngineEnabled) {
      console.log('[PricingCron] Motor de precios desactivado. Omitiendo ejecución automática.');
      return;
    }
    await updatePrices();
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
  
};

module.exports = startPricingCron;
