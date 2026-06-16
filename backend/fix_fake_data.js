const { Order } = require('./models');

async function fixFakeData() {
  const orders = await Order.findAll();
  const paymentMethods = ['Tarjeta de Crédito Visa', 'MercadoPago', 'Transferencia Bancaria', 'Tarjeta de Débito Mastercard'];
  const cities = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'];
  const streets = ['Av. Corrientes', 'Av. Rivadavia', 'San Martín', 'Belgrano', 'Sarmiento'];
  
  for (let o of orders) {
    let updateData = {};
    if (o.payment_method === 'Tarjeta Falsa' || o.payment_method === 'tarjeta_falsa' || o.payment_method === 'Tarjeta falsa') {
      updateData.payment_method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    }
    if (o.shipping_address && o.shipping_address.includes('Falsa')) {
      const street = streets[Math.floor(Math.random() * streets.length)];
      const num = Math.floor(Math.random() * 4000) + 100;
      const city = cities[Math.floor(Math.random() * cities.length)];
      updateData.shipping_address = `${street} ${num}, ${city}`;
    }
    
    if (Object.keys(updateData).length > 0) {
      await o.update(updateData);
    }
  }
  console.log('Fake data fixed');
  process.exit(0);
}

fixFakeData();
