const sequelize = require('./config/database');

async function fix() {
  await sequelize.query("UPDATE log_motor_precio SET detalle = 'Carga masiva fake' WHERE detalle IS NULL");
  console.log('Updated');
  process.exit(0);
}
fix();
