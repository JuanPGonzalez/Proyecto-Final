const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'hardware_haven'
  });

  console.log('--- Database Migration Started ---');

  try {
    // 1. Add columns if they don't exist
    const [columns] = await conn.execute('DESCRIBE componente');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('socket')) {
      console.log('Adding column: socket');
      await conn.execute('ALTER TABLE componente ADD COLUMN socket VARCHAR(50) DEFAULT NULL');
    }
    if (!columnNames.includes('memory_type')) {
      console.log('Adding column: memory_type');
      await conn.execute('ALTER TABLE componente ADD COLUMN memory_type VARCHAR(50) DEFAULT NULL');
    }

    // 2. Data Enrichment - Extracting from descriptions
    const [products] = await conn.execute('SELECT id, name, description FROM componente');
    
    for (const p of products) {
      const desc = (p.description || '').toLowerCase() + ' ' + (p.name || '').toLowerCase();
      let socket = null;
      let memoryType = null;

      // Extract Socket
      if (desc.includes('1700')) socket = 'LGA1700';
      else if (desc.includes('1200')) socket = 'LGA1200';
      else if (desc.includes('1151')) socket = 'LGA1151';
      else if (desc.includes('am4')) socket = 'AM4';
      else if (desc.includes('am5')) socket = 'AM5';

      // Extract Memory Type
      if (desc.includes('ddr5')) memoryType = 'DDR5';
      else if (desc.includes('ddr4')) memoryType = 'DDR4';

      if (socket || memoryType) {
        await conn.execute('UPDATE componente SET socket = ?, memory_type = ? WHERE id = ?', [socket, memoryType, p.id]);
      }
    }
    console.log('Compatibility data enriched.');

    // 3. Update Image URLs with real ones
    const imageUpdates = [
      { id: 19, url: 'https://m.media-amazon.com/images/I/5176AclS60L._AC_SL1200_.jpg' }, // i5-12400F
      { id: 20, url: 'https://m.media-amazon.com/images/I/616VM20+AzL._AC_SL1384_.jpg' }, // Ryzen 5 5600X
      { id: 21, url: 'https://m.media-amazon.com/images/I/51kHiPeTSmL._AC_SL1000_.jpg' }, // Corsair 16GB
      { id: 22, url: 'https://m.media-amazon.com/images/I/61-9n3R1VPL._AC_SL1500_.jpg' }, // Kingston 8GB
      { id: 23, url: 'https://m.media-amazon.com/images/I/81xG-Y-uUHL._AC_SL1500_.jpg' }, // ASUS B550
      { id: 11, url: 'https://m.media-amazon.com/images/I/719fH95q1FL._AC_SL1500_.jpg' }, // Generic A (assuming RAM)
      { id: 12, url: 'https://m.media-amazon.com/images/I/6182S7MYC2L._AC_SL1500_.jpg' }, // Generic B
    ];

    for (const update of imageUpdates) {
      await conn.execute('UPDATE componente SET img_url = ? WHERE id = ?', [update.url, update.id]);
    }
    console.log('Product images updated with real URLs.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await conn.end();
    console.log('--- Migration Finished ---');
  }
}

migrate();
