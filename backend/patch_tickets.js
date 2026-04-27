const sequelize = require('./config/database');

async function patchTickets() {
  try {
    await sequelize.query('ALTER TABLE reclamos ADD COLUMN admin_id INT UNSIGNED DEFAULT NULL;');
    console.log('Patch aplicado: columna admin_id agregada.');
  } catch (error) {
    if (error.parent && error.parent.errno === 1060) {
      console.log('La columna admin_id ya existe en reclamos.');
    } else {
      console.error('Error aplicando patch:', error.message);
    }
  } finally {
    process.exit();
  }
}

patchTickets();
