const { sequelize, Order } = require('./models');

async function fixShippingTypes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const orders = await Order.findAll();
    const uniqueTipoEnvio = [...new Set(orders.map(o => o.tipo_envio))];
    const uniqueShippingMethod = [...new Set(orders.map(o => o.shipping_method))];
    
    console.log('Current tipo_envio values:', uniqueTipoEnvio);
    console.log('Current shipping_method values:', uniqueShippingMethod);

    let updatedCount = 0;

    for (const order of orders) {
      let changed = false;
      let newTipoEnvio = order.tipo_envio;
      let newShippingMethod = order.shipping_method;

      const normalize = (val) => {
        if (!val) return null;
        const lower = val.toLowerCase();
        if (lower.includes('retiro') || lower.includes('sucursal') || lower.includes('tienda')) {
          return 'Retiro en tienda';
        }
        if (lower.includes('domicilio') || lower.includes('envio') || lower.includes('envío')) {
          return 'Envio a domicilio';
        }
        return 'Envio a domicilio'; // Default fallback
      };

      if (newTipoEnvio) {
        const norm = normalize(newTipoEnvio);
        if (norm !== newTipoEnvio) {
          newTipoEnvio = norm;
          changed = true;
        }
      }

      if (newShippingMethod) {
         const norm = normalize(newShippingMethod);
         if (norm !== newShippingMethod) {
            newShippingMethod = norm;
            changed = true;
         }
      }

      if (changed) {
        await order.update({
          tipo_envio: newTipoEnvio,
          shipping_method: newShippingMethod
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} orders to match the correct shipping types.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixShippingTypes();
