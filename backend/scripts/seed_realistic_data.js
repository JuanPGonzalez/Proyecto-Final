
const { sequelize, User, Product, Order, OrderItem, UserView } = require('../models');

// Argentine Specific Data
const argCities = [
  { provincia: 'Buenos Aires', localidad: 'La Plata', cp: '1900' },
  { provincia: 'Capital Federal', localidad: 'Palermo', cp: '1425' },
  { provincia: 'Capital Federal', localidad: 'Belgrano', cp: '1428' },
  { provincia: 'Córdoba', localidad: 'Córdoba Capital', cp: '5000' },
  { provincia: 'Santa Fe', localidad: 'Rosario', cp: '2000' },
  { provincia: 'Mendoza', localidad: 'Mendoza', cp: '5500' },
  { provincia: 'Tucumán', localidad: 'San Miguel de Tucumán', cp: '4000' },
  { provincia: 'Buenos Aires', localidad: 'Mar del Plata', cp: '7600' },
  { provincia: 'Buenos Aires', localidad: 'Bahía Blanca', cp: '8000' },
  { provincia: 'Misiones', localidad: 'Posadas', cp: '3300' }
];

const streets = ['Av. Rivadavia', 'Av. Santa Fe', 'Calle Florida', 'Av. de Mayo', 'Av. Corrientes', 'Av. 9 de Julio', 'Av. Cabildo', 'Av. Juan B. Justo', 'Av. Pueyrredón', 'Calle San Martín'];

const firstNames = ['Sergio', 'Lucía', 'Pablo', 'Camila', 'Mateo', 'Valentina', 'Joaquín', 'Martina', 'Nicolás', 'Sofía', 'Felipe', 'Bautista', 'Juana', 'Tomás', 'Delfina', 'Ignacio', 'Victoria', 'Julián', 'Catalina', 'Agustín'];
const lastNames = ['Gómez', 'Martínez', 'Fernández', 'Rodríguez', 'López', 'Sánchez', 'Pérez', 'González', 'Romero', 'García', 'Díaz', 'Sosa', 'Álvarez', 'Acosta', 'Silva', 'Pereira', 'Torres', 'Suárez', 'Castro', 'Vázquez'];

const paymentMethods = ['Transferencia', 'Tarjeta de Crédito', 'Mercado Pago'];
const shippingMethods = ['Envío a domicilio', 'Retiro en sucursal'];

function getRandomDate(monthsAgo) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsAgo);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomAddress() {
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 5000) + 100;
  return `${street} ${number}`;
}

async function seed() {
  try {
    console.log('🚀 Starting realistic data generation...');

    // 1. Get existing products
    const products = await Product.findAll();
    if (products.length === 0) {
      console.error('❌ No products found in database. Please seed products first.');
      return;
    }
    console.log(`📦 Found ${products.length} products.`);

    // 2. Generate 15 Realistic Users
    const users = [];
    console.log('👥 Creating 15 realistic users...');
    for (let i = 0; i < 15; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const user = await User.create({
        name,
        email,
        password: 'password123', // Dummy password for seed (usually bcrypt'ed but for analytics it doesn't matter much)
        tipoUsuario: 'cliente',
        direccion: `${getRandomAddress()}, ${argCities[Math.floor(Math.random() * argCities.length)].localidad}`,
        sexo: Math.random() > 0.5 ? 'Masculino' : 'Femenino',
        fechaNac: getRandomDate(40), // Random birthdate
        fechaReg: getRandomDate(12) // Registered in last year
      });
      users.push(user);
    }

    // 3. Distribution settings
    const distribution = {
      'Cerrada': 35, // 30 + 5 (Enviado)
      'En preparación': 10,
      'Pendiente': 8,
      'Pendiente de Validación': 3, // Pagado
      'Cancelada': 4
    };

    const statusList = [];
    for (const [status, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        statusList.push(status);
      }
    }
    // Shuffle status list
    statusList.sort(() => Math.random() - 0.5);

    // 4. Generate 60 Purchases
    console.log('🛒 Generating 60 purchases...');
    for (let i = 0; i < 60; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statusList[i] || 'Cerrada';
      const city = argCities[Math.floor(Math.random() * argCities.length)];
      const fechaCompra = getRandomDate(6);

      const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
      const shippingCost = shippingMethod === 'Envío a domicilio' ? Math.floor(Math.random() * 3000) + 1500 : 0;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const order = await Order.create({
        total: 0,
        fecha_compra: fechaCompra,
        user_id: user.id,
        status: status,
        shipping_address: getRandomAddress(),
        localidad: city.localidad,
        codigo_postal: city.cp,
        provincia: city.provincia,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        payment_method: paymentMethod,
        tipo_envio: shippingMethod === 'Retiro en sucursal' ? 'retiro' : 'envio'
      });

      let orderTotal = Number(shippingCost);
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (selectedProducts.find(p => p.id === product.id)) continue;
        selectedProducts.push(product);

        const quantity = Math.floor(Math.random() * 2) + 1;
        const subtotal = Number(product.price) * quantity;
        orderTotal += subtotal;

        await OrderItem.create({
          quantity,
          priceAtPurchase: product.price,
          compra_id: order.id,
          componente_id: product.id
        });
      }

      await order.update({ total: orderTotal });
    }

    // 5. Generate User Views
    console.log('👀 Generating browsing activity...');
    for (const user of users) {
      const numViews = Math.floor(Math.random() * 15) + 5;
      for (let i = 0; i < numViews; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        await UserView.create({
          user_id: user.id,
          product_id: product.id,
          count: Math.floor(Math.random() * 3) + 1
        });
      }
    }

    console.log('✅ Success! Realistic data seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();
