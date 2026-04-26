const mysql = require('mysql2/promise');

async function finalFix() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'hardware_haven'
  });

  console.log('--- Final Massive Fix Started ---');

  try {
    // 1. Update important component data (Compatibility + Images)
    const updates = [
      { 
        id: 1, 
        socket: 'LGA1700', 
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_38650_Procesador_Intel_Core_i9_13900F_5.6GHz_Turbo_Scoket_1700_-Sin_Video-_ed917f49-grn.jpg' 
      },
      { 
        id: 3, 
        socket: 'LGA1700', 
        memory_type: 'DDR5',
        img_url: 'https://http2.mlstatic.com/D_NQ_NP_838357-MLU70594908720_072023-O.webp'
      },
      { 
        id: 20, 
        socket: 'AM4', 
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_22340_Procesador_AMD_Ryzen_5_5600X_4.6GHz_Turbo_AM4_Wraith_Stealth_Cooler_938562d2-grn.jpg'
      },
      { 
        id: 19, 
        socket: 'LGA1700', 
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_32341_Procesador_Intel_Core_i5_12400F_4.4GHz_Turbo_Socket_1700_Alder_Lake_0d9f8e4b-grn.jpg'
      },
      { 
        id: 23, 
        socket: 'AM4', 
        memory_type: 'DDR4',
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_20845_Mother_Asus_Prime_B550M-A_AM4_31f7c10b-grn.jpg'
      },
      {
        id: 2,
        memory_type: 'DDR4',
        img_url: 'https://http2.mlstatic.com/D_NQ_NP_641269-MLU72889570380_112023-O.webp'
      },
      {
        id: 21,
        memory_type: 'DDR4',
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_15750_Memoria_Corsair_DDR4_16GB_3200MHz_Vengeance_LPX_Black_f61b17f5-grn.jpg'
      },
      {
        id: 22,
        memory_type: 'DDR4',
        img_url: 'https://imagenes.compragamer.com/productos/compragamer_Imganen_general_32770_Memoria_Kingston_DDR4_8GB_3200MHz_Fury_Beast_RGB_7f0e7d01-grn.jpg'
      }
    ];

    for (const u of updates) {
      const sets = [];
      const params = [];
      if (u.socket) { sets.push('socket = ?'); params.push(u.socket); }
      if (u.memory_type) { sets.push('memory_type = ?'); params.push(u.memory_type); }
      if (u.img_url) { sets.push('img_url = ?'); params.push(u.img_url); }
      params.push(u.id);

      if (sets.length > 0) {
        await conn.execute(`UPDATE componente SET ${sets.join(', ')} WHERE id = ?`, params);
      }
    }
    console.log('Database enriched with manual high-quality data.');

    // 2. Generic data enrichment for the rest
    await conn.execute("UPDATE componente SET socket = 'AM4' WHERE description LIKE '%AM4%' OR name LIKE '%AM4%'");
    await conn.execute("UPDATE componente SET socket = 'LGA1700' WHERE description LIKE '%1700%' OR name LIKE '%1700%'");
    await conn.execute("UPDATE componente SET memory_type = 'DDR4' WHERE description LIKE '%DDR4%' OR name LIKE '%DDR4%'");
    await conn.execute("UPDATE componente SET memory_type = 'DDR5' WHERE description LIKE '%DDR5%' OR name LIKE '%DDR5%'");
    console.log('Generic enrichment completed.');

  } catch (err) {
    console.error('Final fix failed:', err);
  } finally {
    await conn.end();
    console.log('--- Final Massive Fix Finished ---');
  }
}

finalFix();
