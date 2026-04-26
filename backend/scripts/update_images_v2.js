const mysql = require('mysql2/promise');

async function updateImages() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'hardware_haven'
  });

  const images = [
    { name: 'Intel Core i9', url: 'https://m.media-amazon.com/images/I/61k7mXkI9BL._AC_SL1200_.jpg' },
    { name: 'Corsair Vengeance LPX 16GB', url: 'https://m.media-amazon.com/images/I/51kHiPeTSmL._AC_SL1000_.jpg' },
    { name: 'ASUS ROG Strix Z790-E', url: 'https://m.media-amazon.com/images/I/81PjP5-yLIL._AC_SL1500_.jpg' },
    { name: 'NVIDIA GeForce RTX 4090', url: 'https://m.media-amazon.com/images/I/71Y8SndnS7L._AC_SL1500_.jpg' },
    { name: 'Gabinete Cougar', url: 'https://m.media-amazon.com/images/I/71XmZJmKqfL._AC_SL1500_.jpg' },
    { name: 'Cámara Logitech', url: 'https://m.media-amazon.com/images/I/61o-uL+P0HL._AC_SL1500_.jpg' },
    { name: 'Intel Core i5-12400F', url: 'https://m.media-amazon.com/images/I/5176AclS60L._AC_SL1200_.jpg' },
    { name: 'AMD Ryzen 5 5600X', url: 'https://m.media-amazon.com/images/I/616VM20+AzL._AC_SL1384_.jpg' },
    { name: 'ASUS B550M-A', url: 'https://m.media-amazon.com/images/I/81xG-Y-uUHL._AC_SL1500_.jpg' },
    { name: 'NVIDIA GeForce RTX 3060', url: 'https://m.media-amazon.com/images/I/719fH95q1FL._AC_SL1500_.jpg' },
    { name: 'Kingston Fury Beast 16GB DDR5', url: 'https://m.media-amazon.com/images/I/61-9n3R1VPL._AC_SL1500_.jpg' },
    { name: 'Logitech G502 HERO', url: 'https://m.media-amazon.com/images/I/51uIuE-I99L._AC_SL1500_.jpg' },
    { name: 'Redragon Kumara K552', url: 'https://m.media-amazon.com/images/I/71c9qYh6-ML._AC_SL1500_.jpg' },
  ];

  console.log('--- Updating Product Images ---');
  for (const item of images) {
    const [result] = await conn.execute('UPDATE componente SET img_url = ? WHERE name LIKE ?', [item.url, `%${item.name}%`]);
    console.log(`Updated ${item.name}: ${result.affectedRows} rows affected.`);
  }
  await conn.end();
}

updateImages();
