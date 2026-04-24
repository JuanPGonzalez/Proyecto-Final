const sequelize = require('./config/database');

async function patchDatabase() {
  const runQuery = async (query) => {
    try {
      await sequelize.query(query);
    } catch (e) {
      if (e.parent && e.parent.errno === 1060) {
        // Ignorar error de columna duplicada
        return;
      }
      console.error(`Error en query: ${query}`, e.message);
    }
  };

  try {
    console.log('Aplicando patch de columnas a componente...');
    await runQuery('ALTER TABLE componente ADD COLUMN imgURL VARCHAR(255);');
    await runQuery('ALTER TABLE componente ADD COLUMN price DECIMAL(10,2) DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN stock INTEGER DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN views INTEGER DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN categoria_id INT UNSIGNED;');
    console.log('✅ Patch finalizado.');
  } catch(e) {
    console.error('Error general en patch', e);
  } finally {
    process.exit();
  }
}

patchDatabase();
