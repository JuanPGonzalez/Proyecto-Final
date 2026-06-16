const { Sequelize } = require('sequelize');
const { User, Order, sequelize } = require('./models');

const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Lucía', 'Pedro', 'Sofia', 'Miguel', 'Marta', 'Javier', 'Elena', 'Diego', 'Laura', 'Fernando', 'Carmen', 'Ricardo', 'Patricia', 'Roberto', 'Isabel', 'Lucas', 'Valeria', 'Joaquin', 'Martina'];
const lastNames = ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Ruiz', 'Díaz', 'Alvarez', 'Moreno', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
  try {
    const users = await User.findAll();
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    console.log(`Scrambling ${users.length} users...`);
    for (const user of users) {
      if (user.role === 'admin') continue; // Don't scramble admins
      
      const newName = getRandomItem(firstNames);
      const newSurname = getRandomItem(lastNames);
      const newDate = getRandomDate(sixMonthsAgo, now);

      await user.update({
        nombre: newName,
        apellido: newSurname,
        created_at: newDate,
      });
    }

    const orders = await Order.findAll();
    console.log(`Scrambling ${orders.length} orders...`);
    
    for (const order of orders) {
      // Find the user to ensure order date is after user creation
      const user = await User.findByPk(order.user_id);
      let orderStart = sixMonthsAgo;
      if (user && user.created_at) {
        orderStart = new Date(user.created_at);
      }
      
      const newOrderDate = getRandomDate(orderStart, now);
      
      // Fix shipping method
      let newShippingMethod = 'domicilio';
      if (order.shipping_method === 'tienda' || order.shipping_method === 'retiro') {
        newShippingMethod = 'tienda';
      }

      await order.update({
        fecha_compra: newOrderDate,
        shipping_method: newShippingMethod
      });
    }

    console.log('Done scrambling data!');
    process.exit(0);
  } catch (error) {
    console.error('Error scrambling data:', error);
    process.exit(1);
  }
}

run();
