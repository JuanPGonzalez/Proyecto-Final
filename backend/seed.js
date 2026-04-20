const { sequelize } = require('./models');

async function runSeed() {
  // Solo sincronizamos sin dropear las tablas que ya tienes creadas
  // alter: false para no sobreescribir la BD vieja agresivamente
  await sequelize.sync({ alter: false });
  console.log('Tablas mapeadas exitosamente. El seed manual ha sido desactivado para proteger tus tablas existentes.');
  process.exit();
}

runSeed();
