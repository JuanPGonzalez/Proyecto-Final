const { User, Product, Order, OrderItem, Category, SupportTicket, Notification, Province, Locality, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  try {
    console.log('--- Iniciando Carga MASIVA de Datos (Seeding Pesado) ---');
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // Actualizar ENUM de tickets manualmente
    await sequelize.query("ALTER TABLE reclamos MODIFY COLUMN status ENUM('Pendiente', 'Respondido', 'Cerrado') NOT NULL DEFAULT 'Pendiente'");
    
    const tables = ['Category', 'Product', 'User', 'Province', 'Locality', 'Order', 'OrderItem', 'SupportTicket', 'Notification'];
    for (const t of tables) {
       await sequelize.models[t].destroy({ where: {}, truncate: { cascade: true } });
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const startDate = new Date(2025, 0, 1); // Desde 2025
    const endDate = new Date();

    // 1. CATEGORÍAS
    console.log('Cargando categorías...');
    const cats = await Category.bulkCreate([
      { descripcion: 'Procesadores' },
      { descripcion: 'Memorias RAM' },
      { descripcion: 'Motherboards' },
      { descripcion: 'Placas de Video' },
      { descripcion: 'Almacenamiento' },
      { descripcion: 'Periféricos' },
      { descripcion: 'Fuentes de Poder' },
      { descripcion: 'Gabinete' },
      { descripcion: 'Refrigeración' }
    ]);

    // 2. PRODUCTOS (~60 total)
    console.log('Cargando 60+ productos...');
    const productsData = [];
    const brands = ['Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Kingston', 'Samsung', 'Logitech', 'Razer', 'Evga', 'Cooler Master'];
    const sockets = ['AM4', 'AM5', 'LGA1200', 'LGA1700'];
    const ramTypes = ['DDR4', 'DDR5'];

    // Mapeo de imágenes por categoría para realismo
    const categoryImages = {
      'Procesadores': [
        'https://m.media-amazon.com/images/I/61BXP668VWL._AC_SL1200_.jpg',
        'https://m.media-amazon.com/images/I/51fS8KqK3NL._AC_SL1000_.jpg'
      ],
      'Memorias RAM': [
        'https://m.media-amazon.com/images/I/51K0u+2Y+IL._AC_SL1000_.jpg',
        'https://m.media-amazon.com/images/I/61X9Q8n8A-L._AC_SL1500_.jpg'
      ],
      'Motherboards': [
        'https://m.media-amazon.com/images/I/81xUeE6BvUL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/81L6E-wP6TL._AC_SL1500_.jpg'
      ],
      'Placas de Video': [
        'https://m.media-amazon.com/images/I/71YyS2nK8AL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/71m6n2m1mTL._AC_SL1500_.jpg'
      ],
      'Almacenamiento': [
        'https://m.media-amazon.com/images/I/61K8PjK0zPL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/71S9iHhS-FL._AC_SL1500_.jpg'
      ],
      'Periféricos': [
        'https://m.media-amazon.com/images/I/51uU8K17-2L._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/71L5N7u6m6L._AC_SL1500_.jpg'
      ],
      'Fuentes de Poder': [
        'https://m.media-amazon.com/images/I/71V2m+f3G+L._AC_SL1500_.jpg'
      ],
      'Gabinete': [
        'https://m.media-amazon.com/images/I/71H256GzKqL._AC_SL1500_.jpg'
      ],
      'Refrigeración': [
        'https://m.media-amazon.com/images/I/71L0I5x88KL._AC_SL1500_.jpg'
      ]
    };

    for (let i = 1; i <= 60; i++) {
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      
      let stock;
      if (i <= 10) stock = 0; // 10 agotados
      else if (i <= 17) stock = Math.floor(Math.random() * 4) + 1; // 7 en alerta (1-4)
      else stock = Math.floor(Math.random() * 100) + 10; // El resto con stock normal

      const imgList = categoryImages[cat.descripcion] || ['https://via.placeholder.com/400x400?text=Hardware'];
      const imgURL = imgList[Math.floor(Math.random() * imgList.length)];

      productsData.push({
        name: `${brand} Component Pro X${i}`,
        description: `Descripción detallada para el componente premium ${i}. Rendimiento extremo garantizado.`,
        price: Math.floor(Math.random() * 800000) + 50000,
        stock: stock,
        categoria_id: cat.id,
        socket: cat.descripcion === 'Procesadores' || cat.descripcion === 'Motherboards' ? sockets[Math.floor(Math.random() * sockets.length)] : null,
        memoryType: cat.descripcion === 'Memorias RAM' || cat.descripcion === 'Motherboards' ? ramTypes[Math.floor(Math.random() * ramTypes.length)] : null,
        imgURL: imgURL
      });
    }
    const products = await Product.bulkCreate(productsData);

    // 3. USUARIOS (~50)
    console.log('Cargando 50+ usuarios...');
    const usersData = [
      { name: 'Admin_Juan', email: 'admin_juan@hardware.com', password: hashedPassword, tipoUsuario: 'administrador', direccion: 'Zeballos 1315', sexo: 'Masculino', fecha_reg: getRandomDate(startDate, endDate), createdAt: getRandomDate(startDate, endDate) },
      { name: 'Admin_Pablo', email: 'admin_pablo@hardware.com', password: hashedPassword, tipoUsuario: 'administrador', direccion: 'Urquiza 2020', sexo: 'Masculino', fecha_reg: getRandomDate(startDate, endDate), createdAt: getRandomDate(startDate, endDate) },
      { name: 'JuanPablo', email: 'juanpablo@cliente.com', password: hashedPassword, tipoUsuario: 'cliente', direccion: 'Pellegrini 1500', sexo: 'Masculino', fecha_reg: getRandomDate(startDate, endDate), createdAt: getRandomDate(startDate, endDate) }
    ];
    for (let i = 1; i <= 50; i++) {
      const regDate = getRandomDate(startDate, endDate);
      usersData.push({
        name: `Usuario_Demo_${i}`,
        email: `user${i}@demo.com`,
        password: hashedPassword,
        tipoUsuario: 'cliente',
        direccion: `Calle Falsa ${100 + i}`,
        sexo: i % 2 === 0 ? 'Masculino' : 'Femenino',
        fechaNac: getRandomDate(new Date(1970, 0, 1), new Date(2005, 0, 1)).toISOString().split('T')[0],
        fecha_reg: regDate,
        createdAt: regDate
      });
    }
    const users = await User.bulkCreate(usersData);
    const clients = users.filter(u => u.tipoUsuario === 'cliente');

    // 4. PROVINCIAS Y LOCALIDADES
    const santaFe = await Province.create({ nombre: 'Santa Fe' });
    const bsAs = await Province.create({ nombre: 'Buenos Aires' });
    const localities = await Locality.bulkCreate([
      { nombre: 'Rosario', codigo_postal: '2000', precio_envio: 2000, provincia_id: santaFe.id },
      { nombre: 'Santa Fe', codigo_postal: '3000', precio_envio: 3000, provincia_id: santaFe.id },
      { nombre: 'CABA', codigo_postal: '1000', precio_envio: 4500, provincia_id: bsAs.id },
      { nombre: 'La Plata', codigo_postal: '1900', precio_envio: 4000, provincia_id: bsAs.id }
    ]);

    // 5. ÓRDENES (~60)
    console.log('Cargando 60+ órdenes...');
    const statuses = ['Pendiente', 'Cerrada', 'Cancelada'];
    const shipMethods = ['normal', 'express', 'tienda'];
    const payMethods = ['card', 'cash', 'transfer'];
    
    for (let i = 1; i <= 65; i++) {
      const user = clients[Math.floor(Math.random() * clients.length)];
      const loc = localities[Math.floor(Math.random() * localities.length)];
      const status = Math.random() > 0.3 ? 'Cerrada' : (Math.random() > 0.5 ? 'Pendiente' : 'Cancelada');
      const orderDate = getRandomDate(startDate, endDate);
      
      const order = await Order.create({
        user_id: user.id,
        total: 0, // Se calcula abajo
        status,
        fecha_compra: orderDate,
        shipping_address: user.direccion,
        localidad: loc.nombre,
        provincia: 'Provincia Demo',
        shipping_method: shipMethods[Math.floor(Math.random() * shipMethods.length)],
        shipping_cost: loc.precio_envio,
        payment_method: payMethods[Math.floor(Math.random() * payMethods.length)]
      });

      // Items para la orden (1 a 4 items)
      let total = 0;
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        await OrderItem.create({
          compra_id: order.id,
          componente_id: prod.id,
          quantity: qty,
          priceAtPurchase: prod.price
        });
        total += Number(prod.price) * qty;
      }
      total += Number(order.shipping_cost);
      await order.update({ total });
    }

    // 6. TICKETS (~50)
    console.log('Cargando 50+ tickets...');
    const ticketStatuses = ['Pendiente', 'Respondido', 'Cerrado'];
    const subjects = ['Garantía', 'Duda Técnica', 'Envío demorado', 'Problema de Pago', 'Facturación', 'Stock'];
    
    for (let i = 1; i <= 55; i++) {
      const user = clients[Math.floor(Math.random() * clients.length)];
      const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
      const created_at = getRandomDate(startDate, endDate);
      
      const admins = users.filter(u => u.tipoUsuario === 'administrador');
      const assignedAdmin = admins[Math.floor(Math.random() * admins.length)];

      await SupportTicket.create({
        user_id: user.id,
        subject: subjects[Math.floor(Math.random() * subjects.length)] + ` #${i}`,
        description: `Esta es una descripción de prueba para el ticket de soporte número ${i}. El usuario reporta un inconveniente.`,
        status,
        respuesta: status === 'Cerrado' || status === 'Respondido' ? 'Hemos procesado su solicitud. Por favor verifique.' : null,
        admin_id: status !== 'Pendiente' ? assignedAdmin.id : null,
        created_at
      });
    }

    // 7. NOTIFICACIONES (~60)
    console.log('Cargando 60+ notificaciones...');
    for (let i = 1; i <= 60; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const created_at = getRandomDate(startDate, endDate);
      await Notification.create({
        user_id: user.id,
        message: `Mensaje de notificación de prueba número ${i}.`,
        type: Math.random() > 0.5 ? 'ORDER' : 'SYSTEM',
        created_at
      });
    }

    console.log('--- CARGA MASIVA COMPLETADA CON ÉXITO ---');
    process.exit(0);
  } catch (error) {
    console.error('Error en el seeding masivo:', error);
    process.exit(1);
  }
}

seed();
