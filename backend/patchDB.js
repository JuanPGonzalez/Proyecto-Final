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
    await runQuery('ALTER TABLE componente ADD COLUMN img_url VARCHAR(255);');
    await runQuery('ALTER TABLE componente ADD COLUMN precio_actual DECIMAL(10,2) DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN stock INTEGER DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN views INTEGER DEFAULT 0;');
    await runQuery('ALTER TABLE componente ADD COLUMN categoria_id INT UNSIGNED;');
    
    console.log('Aplicando patch de columnas a compra...');
    await runQuery('ALTER TABLE compra ADD COLUMN localidad VARCHAR(255);');
    await runQuery('ALTER TABLE compra ADD COLUMN codigo_postal VARCHAR(255);');

    console.log('Aplicando patch de columnas a notifications...');
    await runQuery('ALTER TABLE notifications MODIFY COLUMN user_id INT UNSIGNED NULL;');
    await runQuery('ALTER TABLE notifications ADD COLUMN title VARCHAR(255);');
    await runQuery('ALTER TABLE notifications ADD COLUMN reference_id INT UNSIGNED;');
    await runQuery('ALTER TABLE notifications ADD COLUMN target_role VARCHAR(50);');
    
    console.log('✅ Patch finalizado.');
  } catch(e) {
    console.error('Error general en patch', e);
  } finally {
    process.exit();
  }
}

patchDatabase();
