const { User, Product, Order, OrderItem, Category, SupportTicket, Notification, Province, Locality, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('--- Iniciando Carga de Datos de Demostración ---');
    
    // Limpiar base de datos para evitar duplicados
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Category.destroy({ where: {}, truncate: { cascade: true } });
    await Product.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });
    await Province.destroy({ where: {}, truncate: { cascade: true } });
    await Locality.destroy({ where: {}, truncate: { cascade: true } });
    await Order.destroy({ where: {}, truncate: { cascade: true } });
    await OrderItem.destroy({ where: {}, truncate: { cascade: true } });
    await SupportTicket.destroy({ where: {}, truncate: { cascade: true } });
    await Notification.destroy({ where: {}, truncate: { cascade: true } });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 1. CATEGORÍAS (Ordenadas según espera el Presupuestador: 1:CPU, 2:RAM, 3:MOBO, 4:GPU)
    console.log('Cargando categorías...');
    const cats = await Category.bulkCreate([
      { descripcion: 'Procesadores' },   // ID 1
      { descripcion: 'Memorias RAM' },   // ID 2
      { descripcion: 'Motherboards' },   // ID 3
      { descripcion: 'Placas de Video' },// ID 4
      { descripcion: 'Almacenamiento' },
      { descripcion: 'Periféricos' },
      { descripcion: 'Fuentes de Poder' }
    ]);

    // 2. PRODUCTOS
    console.log('Cargando productos...');
    const products = await Product.bulkCreate([
      // CPUs (Socket AM5 / LGA1700)
      { name: 'Intel Core i9-13900K', price: 650000, stock: 15, categoria_id: cats[0].id, socket: 'LGA1700', description: '24 núcleos, 5.8GHz Turbo', imgURL: 'https://m.media-amazon.com/images/I/61BXP668VWL._AC_SL1200_.jpg' },
      { name: 'Intel Core i7-13700K', price: 450000, stock: 20, categoria_id: cats[0].id, socket: 'LGA1700', description: '16 núcleos, 5.4GHz Turbo', imgURL: 'https://m.media-amazon.com/images/I/61BXP668VWL._AC_SL1200_.jpg' },
      { name: 'AMD Ryzen 7 7800X3D', price: 480000, stock: 20, categoria_id: cats[0].id, socket: 'AM5', description: '8 núcleos con V-Cache para gaming', imgURL: 'https://m.media-amazon.com/images/I/51fS8KqK3NL._AC_SL1000_.jpg' },
      { name: 'AMD Ryzen 5 7600X', price: 320000, stock: 25, categoria_id: cats[0].id, socket: 'AM5', description: '6 núcleos, 5.3GHz Turbo', imgURL: 'https://m.media-amazon.com/images/I/51fS8KqK3NL._AC_SL1000_.jpg' },

      // RAMs (DDR4 / DDR5)
      { name: 'Corsair Vengeance 32GB DDR5', price: 180000, stock: 30, categoria_id: cats[1].id, memoryType: 'DDR5', description: '6000MHz CL36', imgURL: 'https://m.media-amazon.com/images/I/51K0u+2Y+IL._AC_SL1000_.jpg' },
      { name: 'Kingston Fury Beast 16GB DDR5', price: 95000, stock: 40, categoria_id: cats[1].id, memoryType: 'DDR5', description: '5200MHz CL40', imgURL: 'https://m.media-amazon.com/images/I/61X9Q8n8A-L._AC_SL1500_.jpg' },
      { name: 'Corsair LPX 16GB DDR4', price: 75000, stock: 50, categoria_id: cats[1].id, memoryType: 'DDR4', description: '3200MHz CL16', imgURL: 'https://m.media-amazon.com/images/I/51K0u+2Y+IL._AC_SL1000_.jpg' },

      // MOBOs
      { name: 'ASUS ROG Strix Z790-E', price: 420000, stock: 5, categoria_id: cats[2].id, socket: 'LGA1700', memoryType: 'DDR5', description: 'WiFi 6E, PCIe 5.0', imgURL: 'https://m.media-amazon.com/images/I/81xUeE6BvUL._AC_SL1500_.jpg' },
      { name: 'MSI PRO Z790-P', price: 280000, stock: 10, categoria_id: cats[2].id, socket: 'LGA1700', memoryType: 'DDR5', description: 'Atx, DDR5, PCIe 5.0', imgURL: 'https://m.media-amazon.com/images/I/81xUeE6BvUL._AC_SL1500_.jpg' },
      { name: 'Gigabyte X670 Gaming X', price: 350000, stock: 12, categoria_id: cats[2].id, socket: 'AM5', memoryType: 'DDR5', description: 'AM5, DDR5, PCIe 5.0', imgURL: 'https://m.media-amazon.com/images/I/81xUeE6BvUL._AC_SL1500_.jpg' },
      { name: 'ASUS Prime B550M-A', price: 120000, stock: 15, categoria_id: cats[2].id, socket: 'AM4', memoryType: 'DDR4', description: 'Micro-ATX, AM4', imgURL: 'https://m.media-amazon.com/images/I/81xUeE6BvUL._AC_SL1500_.jpg' },

      // GPUs
      { name: 'NVIDIA RTX 4080 Super', price: 1200000, stock: 8, categoria_id: cats[3].id, description: '16GB GDDR6X', imgURL: 'https://m.media-amazon.com/images/I/71YyS2nK8AL._AC_SL1500_.jpg' },
      { name: 'NVIDIA RTX 4070 Ti', price: 850000, stock: 10, categoria_id: cats[3].id, description: '12GB GDDR6X', imgURL: 'https://m.media-amazon.com/images/I/71m6n2m1mTL._AC_SL1500_.jpg' },
      { name: 'NVIDIA RTX 4060 Ti', price: 550000, stock: 12, categoria_id: cats[3].id, description: '8GB GDDR6', imgURL: 'https://m.media-amazon.com/images/I/71m6n2m1mTL._AC_SL1500_.jpg' },
      { name: 'AMD Radeon RX 7900 XTX', price: 1100000, stock: 5, categoria_id: cats[3].id, description: '24GB GDDR6', imgURL: 'https://m.media-amazon.com/images/I/71m6n2m1mTL._AC_SL1500_.jpg' },

      // Otros
      { name: 'Samsung 990 Pro 2TB', price: 250000, stock: 25, categoria_id: cats[4].id, description: 'Lectura 7450MB/s', imgURL: 'https://m.media-amazon.com/images/I/61K8PjK0zPL._AC_SL1500_.jpg' },
      { name: 'Logitech G Pro X Superlight', price: 150000, stock: 10, categoria_id: cats[5].id, description: 'Mouse inalámbrico', imgURL: 'https://m.media-amazon.com/images/I/51uU8K17-2L._AC_SL1500_.jpg' }
    ]);

    // 3. USUARIOS
    console.log('Cargando usuarios...');
    const users = await User.bulkCreate([
      { name: 'Admin Principal', email: 'admin@hardwarehaven.com', password: hashedPassword, tipoUsuario: 'administrador', direccion: 'Zeballos 1315', sexo: 'Masculino' },
      { name: 'Admin Secundario', email: 'admin2@hardwarehaven.com', password: hashedPassword, tipoUsuario: 'administrador', direccion: 'Urquiza 1200', sexo: 'Femenino' },
      { name: 'Juan Perez', email: 'juan@demo.com', password: hashedPassword, tipoUsuario: 'cliente', direccion: 'Calle Falsa 123', sexo: 'Masculino', fechaNac: '1990-05-15' },
      { name: 'Maria Lopez', email: 'maria@demo.com', password: hashedPassword, tipoUsuario: 'cliente', direccion: 'Avenida Siempre Viva 742', sexo: 'Femenino', fechaNac: '1985-11-20' },
      { name: 'Lucas Garcia', email: 'lucas@demo.com', password: hashedPassword, tipoUsuario: 'cliente', direccion: 'Pellegrini 2000', sexo: 'Masculino', fechaNac: '1995-02-10' }
    ]);

    // 4. PROVINCIAS Y LOCALIDADES (Demo)
    console.log('Cargando provincias y localidades...');
    const santaFe = await Province.create({ nombre: 'Santa Fe' });
    const rosario = await Locality.create({ nombre: 'Rosario', codigo_postal: '2000', precio_envio: 2500, provincia_id: santaFe.id });
    const santaFeCap = await Locality.create({ nombre: 'Santa Fe Capital', codigo_postal: '3000', precio_envio: 3500, provincia_id: santaFe.id });

    // 5. ÓRDENES (Fechas pasadas y presentes)
    console.log('Cargando órdenes...');
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const orders = await Order.bulkCreate([
      { 
        user_id: users[2].id, 
        total: 1202500, 
        status: 'Cerrada', 
        fecha_compra: lastMonth, 
        shipping_address: 'Calle Falsa 123', 
        localidad: 'Rosario', 
        provincia: 'Santa Fe',
        shipping_method: 'normal',
        shipping_cost: 2500,
        payment_method: 'card'
      },
      { 
        user_id: users[3].id, 
        total: 553500, 
        status: 'Cerrada', 
        fecha_compra: yesterday, 
        shipping_address: 'Avenida Siempre Viva 742', 
        localidad: 'Santa Fe Capital', 
        provincia: 'Santa Fe',
        shipping_method: 'express',
        shipping_cost: 3500,
        payment_method: 'cash'
      },
      { 
        user_id: users[4].id, 
        total: 150000, 
        status: 'Pendiente', 
        fecha_compra: now, 
        shipping_address: null, 
        localidad: null, 
        provincia: null,
        shipping_method: 'tienda',
        shipping_cost: 0,
        payment_method: 'cash'
      }
    ]);

    // Items de órdenes
    await OrderItem.bulkCreate([
      { compra_id: orders[0].id, componente_id: products[2].id, quantity: 1, priceAtPurchase: 1200000 },
      { compra_id: orders[1].id, componente_id: products[3].id, quantity: 1, priceAtPurchase: 550000 },
      { compra_id: orders[2].id, componente_id: products[8].id, quantity: 1, priceAtPurchase: 150000 }
    ]);

    // 6. TICKETS
    console.log('Cargando tickets de soporte...');
    await SupportTicket.bulkCreate([
      { user_id: users[2].id, subject: 'Problema con la fuente', description: 'La fuente hace un ruido extraño cuando juego.', status: 'Cerrado', respuesta: 'Por favor traiga el equipo al local para revisión por garantía.', created_at: lastMonth },
      { user_id: users[3].id, subject: 'Consulta de compatibilidad', description: '¿Esta RAM sirve para mi Ryzen 5?', status: 'Abierto', created_at: yesterday }
    ]);

    // 7. NOTIFICACIONES
    console.log('Cargando notificaciones...');
    await Notification.bulkCreate([
      { user_id: users[2].id, message: 'Tu pedido #1 ha sido entregado.', type: 'ORDER', created_at: lastMonth },
      { user_id: users[0].id, message: 'Nueva consulta de soporte recibida.', type: 'SYSTEM', created_at: yesterday }
    ]);

    console.log('--- Carga Completa Exitosa ---');
    process.exit(0);
  } catch (error) {
    console.error('Error en el seeding:', error);
    process.exit(1);
  }
}

seed();
