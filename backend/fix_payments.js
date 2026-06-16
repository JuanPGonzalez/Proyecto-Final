const Sequelize = require('sequelize');
const sequelize = new Sequelize('hardware_haven', 'root', 'root', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false
});

(async () => {
  try {
    await sequelize.query("UPDATE compra SET payment_method = 'Efectivo' WHERE payment_method IN ('cash', 'Efectivo');");
    await sequelize.query("UPDATE compra SET payment_method = 'Tarjeta de Crédito/Débito' WHERE payment_method IN ('card', 'MercadoPago', 'Tarjeta de Crédito Visa', 'Tarjeta de Débito Mastercard', 'Tarjeta');");
    await sequelize.query("UPDATE compra SET payment_method = 'Transferencia' WHERE payment_method IN ('transfer', 'Transferencia Bancaria', 'Transferencia', 'trasnferencia');");
    
    const pm = await sequelize.query('SELECT payment_method, COUNT(*) as c FROM compra GROUP BY payment_method', { type: Sequelize.QueryTypes.SELECT });
    console.log('Normalized Payment Methods:', pm);
  } catch (e) {
    console.error(e);
  } finally {
    sequelize.close();
  }
})();
