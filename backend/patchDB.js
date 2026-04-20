const sequelize = require('./config/database');

async function patchDatabase() {
  try {
    console.log('Aplicando patch de columnas a componente...');
    await sequelize.query('ALTER TABLE componente ADD COLUMN imgURL VARCHAR(255);').catch(()=>null);
    await sequelize.query('ALTER TABLE componente ADD COLUMN price DECIMAL(10,2) DEFAULT 0;').catch(()=>null);
    await sequelize.query('ALTER TABLE componente ADD COLUMN stock INTEGER DEFAULT 0;').catch(()=>null);
    await sequelize.query('ALTER TABLE componente ADD COLUMN views INTEGER DEFAULT 0;').catch(()=>null);
    console.log('✅ Patch aplicado. Columnas agregadas a componente.');
  } catch(e) {
    console.error('Error aplicando patch', e);
  } finally {
    process.exit();
  }
}

patchDatabase();
