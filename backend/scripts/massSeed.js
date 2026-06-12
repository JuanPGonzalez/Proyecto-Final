const { sequelize, User, Product, Order, OrderItem, SupportTicket, UserView, Notification, LogMotorPrecio } = require('../models');
const bcrypt = require('bcryptjs');

const NUM_RECORDS = 100;

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function runSeed() {
  console.log('Iniciando carga masiva de datos...');

  try {
    await sequelize.authenticate();
    console.log('Conexión a la DB establecida.');

    const products = await Product.findAll();
    if (products.length === 0) {
      console.log('No hay productos en la base de datos.');
      process.exit(1);
    }
    const productIds = products.map(p => p.id);

    console.log('Modificando stock de los productos existentes...');
    for (const product of products) {
      const newStock = randomNumber(0, 150);
      await product.update({ stock: newStock });
    }

    console.log(`Generando ${NUM_RECORDS} usuarios...`);
    const usersData = [];
    const passwordHash = await bcrypt.hash('password123', 10);
    for (let i = 0; i < NUM_RECORDS; i++) {
      usersData.push({
        name: `UsuarioFalso ${i}`,
        email: `falso${i}_${Date.now()}@test.com`,
        password: passwordHash,
        tipoUsuario: 'cliente',
        fechaReg: new Date(),
        sexo: 'Masculino',
        fechaNac: new Date(1990, 0, 1),
        direccion: `Calle Falsa ${randomNumber(100, 9999)}`,
        dni: randomNumber(10000000, 99999999)
      });
    }
    const createdUsers = await User.bulkCreate(usersData);
    const userIds = createdUsers.map(u => u.id);

    console.log(`Generando ${NUM_RECORDS} órdenes...`);
    const ordersData = [];
    const orderStatuses = ['Pendiente', 'En preparación', 'Cerrada', 'Cancelada'];
    for (let i = 0; i < NUM_RECORDS; i++) {
      ordersData.push({
        total: randomNumber(10000, 500000),
        fecha_compra: randomDate(new Date(2023, 0, 1), new Date()),
        user_id: randomElement(userIds),
        status: randomElement(orderStatuses),
        shipping_address: `Calle Falsa ${randomNumber(100, 9999)}`,
        localidad: 'Ciudad Generada',
        codigo_postal: '1000',
        shipping_method: 'Envío Standard',
        shipping_cost: randomNumber(1000, 5000),
        provincia: 'Buenos Aires',
        payment_method: 'Tarjeta Falsa',
        tipo_envio: 'domicilio'
      });
    }
    const createdOrders = await Order.bulkCreate(ordersData);
    const orderIds = createdOrders.map(o => o.id);

    console.log(`Generando ${NUM_RECORDS} líneas de compra...`);
    const orderItemsData = [];
    for (let i = 0; i < NUM_RECORDS; i++) {
      orderItemsData.push({
        quantity: randomNumber(1, 5),
        priceAtPurchase: randomNumber(5000, 100000),
        compra_id: randomElement(orderIds),
        componente_id: randomElement(productIds)
      });
    }
    await OrderItem.bulkCreate(orderItemsData);

    console.log(`Generando ${NUM_RECORDS} tickets de soporte...`);
    const ticketsData = [];
    for (let i = 0; i < NUM_RECORDS; i++) {
      ticketsData.push({
        user_id: randomElement(userIds),
        subject: `Problema Falso ${i}`,
        description: 'Mensaje generado por script.',
        status: Math.random() > 0.5 ? 'abierto' : 'cerrado'
      });
    }
    await SupportTicket.bulkCreate(ticketsData);

    console.log(`Generando ${NUM_RECORDS} vistas de usuario...`);
    const viewsData = [];
    for (let i = 0; i < NUM_RECORDS; i++) {
      viewsData.push({
        user_id: randomElement(userIds),
        product_id: randomElement(productIds),
        count: randomNumber(1, 50)
      });
    }
    await UserView.bulkCreate(viewsData);

    console.log(`Generando ${NUM_RECORDS} notificaciones...`);
    const notifData = [];
    const notifTypes = ['SYSTEM', 'ORDER', 'TICKET', 'AUTH'];
    for (let i = 0; i < NUM_RECORDS; i++) {
      notifData.push({
        user_id: randomElement(userIds),
        title: `Alerta Falsa ${i}`,
        message: 'Notificación autogenerada.',
        type: randomElement(notifTypes),
        is_read: Math.random() > 0.5
      });
    }
    await Notification.bulkCreate(notifData);

    console.log(`Generando ${NUM_RECORDS} logs de pricing...`);
    const logsData = [];
    for (let i = 0; i < NUM_RECORDS; i++) {
      const pAnterior = randomNumber(10000, 100000);
      const pNuevo = pAnterior * (1 + (randomNumber(-10, 10) / 100));
      logsData.push({
        componente_id: randomElement(productIds),
        precio_anterior: pAnterior,
        precio_nuevo: pNuevo,
        motivo: 'Carga masiva fake'
      });
    }
    await LogMotorPrecio.bulkCreate(logsData);

    console.log('✅ ¡Carga masiva completada con éxito!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runSeed();
