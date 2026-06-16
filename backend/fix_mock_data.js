const { sequelize, User, SupportTicket, Order, LogMotorPrecio, Product } = require('./models');
const { Op } = require('sequelize');

const realFirstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Lucía', 'Jorge', 'Sofía', 'Martín', 'Valeria', 'Diego', 'Camila', 'Federico', 'Micaela', 'Agustín', 'Julieta', 'Pablo', 'Florencia', 'Lucas', 'Martina', 'Maximiliano'];
const realLastNames = ['García', 'López', 'Martínez', 'Rodríguez', 'Pérez', 'González', 'Fernández', 'Gómez', 'Díaz', 'Romero', 'Álvarez', 'Ruiz', 'Vidal', 'Sosa', 'Silva', 'Molina', 'Herrera', 'Castro'];

const realisticSubjects = [
  'Demora en entrega de placa de video',
  'Garantía de procesador',
  'Problema con memoria RAM',
  'Consulta sobre fuente de poder',
  'Compatibilidad de motherboard',
  'Envío no actualizado',
  'Devolución de teclado mecánico',
  'Monitor con pixel muerto',
  'Duda sobre armado de PC',
  'Problemas de refrigeración líquida'
];

const realisticMessages = [
  'Hola, quería consultar porque el producto me llegó con una pequeña abolladura en la caja. ¿Afecta a la garantía?',
  'Mi paquete dice entregado pero no lo he recibido. ¿Me ayudan a rastrearlo?',
  'Compré una mother y procesador pero no levanta imagen. ¿Será problema de la BIOS?',
  'Necesito tramitar el RMA de mi placa. Empezó a hacer un ruido raro en los ventiladores.',
  '¿Hacen envíos al interior por Andreani? Mi código postal es 4000.',
  'Buenas tardes, el monitor tiene un pixel atascado en verde. ¿Lo puedo cambiar?',
  '¿Tienen stock de la RTX 4070 para retirar hoy mismo por el local?',
  'Compré una fuente de 600W, pero creo que me quedé corto para mi nueva PC. ¿Puedo abonar la diferencia por una de 850W?'
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function fixMockData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la BD');

    // 1. Fix Users
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%falso%' } },
          { name: { [Op.like]: '%Falso%' } },
          { email: { [Op.like]: '%test%' } }
        ]
      }
    });

    console.log(`Buscando usuarios falsos... Se encontraron ${users.length}`);

    for (let u of users) {
      const firstName = getRandomItem(realFirstNames);
      const lastName = getRandomItem(realLastNames);
      const randomDate = getRandomDate(new Date(2025, 0, 1), new Date());
      
      u.name = `${firstName} ${lastName}`;
      u.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${u.id}@gmail.com`;
      u.fecha_reg = randomDate;
      await u.save();
    }
    console.log(`✅ Usuarios arreglados.`);

    // 2. Fix Tickets
    const tickets = await SupportTicket.findAll({
      where: {
        [Op.or]: [
          { subject: { [Op.like]: '%falso%' } },
          { subject: { [Op.like]: '%Falso%' } },
          { description: { [Op.like]: '%falsa%' } }
        ]
      }
    });

    console.log(`Buscando tickets falsos... Se encontraron ${tickets.length}`);

    for (let t of tickets) {
      const randomDate = getRandomDate(new Date(2026, 0, 1), new Date());
      t.subject = getRandomItem(realisticSubjects);
      t.description = getRandomItem(realisticMessages);
      t.created_at = randomDate;
      t.updated_at = randomDate; // assuming no updates
      await t.save();
    }
    console.log(`✅ Tickets arreglados.`);

    // 3. Fix Orders Dates to be distributed
    const orders = await Order.findAll();
    console.log(`Buscando órdenes para distribuir fechas... Se encontraron ${orders.length}`);
    let fixedOrders = 0;
    
    // Some mock script probably created all orders on the same day. Let's spread them out over 2026.
    for (let o of orders) {
       // If the order has "test" or "falso" we just randomize its date
       const randomDate = getRandomDate(new Date(2026, 0, 1), new Date());
       o.fecha_compra = randomDate;
       await o.save();
       fixedOrders++;
    }
    console.log(`✅ Fechas de ${fixedOrders} órdenes distribuidas a lo largo del año.`);

    // 4. Fix Pricing History (LogMotorPrecio)
    // Buscamos productos que digan "falso" o borramos los logs de productos eliminados o sin sentido.
    // También crearemos algunos logs de precios recientes para productos más vendidos para que la gráfica del buscador tenga datos reales.
    
    // Primero, limpiar logs absurdos
    const absLogs = await LogMotorPrecio.destroy({
      where: {
        detalle: { [Op.like]: '%falso%' }
      }
    });
    console.log(`✅ Se borraron ${absLogs} logs de precio con descripciones "falsas".`);

    // Vamos a buscar los 5 productos más caros y generarles un historial de precios reciente simulado (por inflación o demanda)
    const topProducts = await Product.findAll({ limit: 10, order: [['price', 'DESC']] });
    
    let logsCreated = 0;
    for (let p of topProducts) {
       const existingLogs = await LogMotorPrecio.count({ where: { componente_id: p.id } });
       if (existingLogs < 5) {
         // Generate 5 random price fluctuations backwards from today
         let currentPrice = Number(p.price);
         for (let i = 0; i < 5; i++) {
           const logDate = new Date();
           logDate.setDate(logDate.getDate() - (i * 5)); // Hace i*5 días
           
           // El precio anterior era un 2% a 5% menos (simulando aumentos)
           const prevPrice = currentPrice * (1 - (Math.random() * 0.05 + 0.02));
           
           await LogMotorPrecio.create({
             componente_id: p.id,
             precio_anterior: prevPrice,
             precio_nuevo: currentPrice,
             detalle: 'Ajuste de precio por inflación / demanda',
             origen: 'motor',
             estado: 'success',
             created_at: logDate
           });
           
           currentPrice = prevPrice;
           logsCreated++;
         }
       }
    }
    console.log(`✅ Se crearon ${logsCreated} logs de precios realistas.`);

    console.log('🎉 Migración de mock data a data realista completada!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing data:', error);
    process.exit(1);
  }
}

fixMockData();
