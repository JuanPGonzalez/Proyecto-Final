const { sequelize, User, Product, Order, OrderItem, SupportTicket } = require('./models');
const bcrypt = require('bcryptjs');

async function seedToday() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    const today = new Date('2026-06-16T15:00:00Z');

    // 1. Create new users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user1 = await User.create({
      name: 'Usuario Nuevo 1',
      email: 'nuevo1_16jun@test.com',
      password: hashedPassword,
      tipoUsuario: 'cliente',
      fechaReg: today,
      sexo: 'Masculino',
      fechaNac: new Date('1990-01-01'),
      direccion: 'Calle Falsa 123',
      dni: 12345678
    });

    const user2 = await User.create({
      name: 'Usuario Nuevo 2',
      email: 'nuevo2_16jun@test.com',
      password: hashedPassword,
      tipoUsuario: 'cliente',
      fechaReg: today,
      sexo: 'Femenino',
      fechaNac: new Date('1995-05-05'),
      direccion: 'Avenida Siempreviva 742',
      dni: 87654321
    });
    
    console.log('Created users:', user1.id, user2.id);

    // 2. Get some products
    const products = await Product.findAll({ limit: 3, where: { isActive: true } });
    if (products.length === 0) {
      console.log('No products found to create orders. Please ensure there are products.');
      process.exit(1);
    }

    // 3. Create Orders and OrderItems
    const order1 = await Order.create({
      total: products[0].price * 2,
      fecha_compra: today,
      user_id: user1.id,
      status: 'Cerrada',
      shipping_address: 'Calle Falsa 123',
      localidad: 'Capital Federal',
      codigo_postal: '1000',
      shipping_method: 'Envío a domicilio',
      shipping_cost: 0,
      provincia: 'Buenos Aires',
      payment_method: 'Tarjeta',
      tipo_envio: 'Envío a domicilio'
    });
    await OrderItem.create({
      quantity: 2,
      priceAtPurchase: products[0].price * 2,
      compra_id: order1.id,
      componente_id: products[0].id
    });

    const order2 = await Order.create({
      total: products[1].price,
      fecha_compra: today,
      user_id: user2.id,
      status: 'Pendiente',
      shipping_address: 'Avenida Siempreviva 742',
      localidad: 'Rosario',
      codigo_postal: '2000',
      shipping_method: 'Retiro en sucursal',
      shipping_cost: 0,
      provincia: 'Santa Fe',
      payment_method: 'Transferencia',
      tipo_envio: 'Retiro en sucursal'
    });
    await OrderItem.create({
      quantity: 1,
      priceAtPurchase: products[1].price,
      compra_id: order2.id,
      componente_id: products[1].id
    });

    const order3 = await Order.create({
      total: products[2] ? products[2].price : products[0].price,
      fecha_compra: today,
      user_id: user1.id,
      status: 'En preparación',
      shipping_address: 'Calle Falsa 123',
      localidad: 'Capital Federal',
      codigo_postal: '1000',
      shipping_method: 'Envío a domicilio',
      shipping_cost: 0,
      provincia: 'Buenos Aires',
      payment_method: 'Efectivo',
      tipo_envio: 'Envío a domicilio'
    });
    await OrderItem.create({
      quantity: 1,
      priceAtPurchase: products[2] ? products[2].price : products[0].price,
      compra_id: order3.id,
      componente_id: products[2] ? products[2].id : products[0].id
    });
    
    console.log('Created orders:', order1.id, order2.id, order3.id);

    // 4. Create Support Tickets
    const ticket1 = await SupportTicket.create({
      user_id: user1.id,
      subject: 'Problema con mi pedido ' + order1.id,
      description: 'El producto llegó con un pequeño rayón, me gustaría saber si puedo cambiarlo.',
      status: 'abierto',
      created_at: today
    });

    const ticket2 = await SupportTicket.create({
      user_id: user2.id,
      subject: 'Consulta sobre compatibilidad',
      description: 'Quería saber si el producto que compré es compatible con mi placa madre actual.',
      status: 'cerrado',
      respuesta: 'Sí, es 100% compatible según las especificaciones. Saludos.',
      admin_id: 1, // assuming admin 1 exists
      created_at: today
    });

    const ticket3 = await SupportTicket.create({
      user_id: user1.id,
      subject: 'Demora en envío',
      description: 'Sigue en preparación desde hace un par de horas, ¿cuándo sale?',
      status: 'abierto',
      created_at: today
    });

    console.log('Created tickets:', ticket1.id, ticket2.id, ticket3.id);

    console.log('Seeding finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedToday();
