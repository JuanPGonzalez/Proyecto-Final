const { Category, Product, sequelize } = require('../models');

async function check() {
  try {
    const cats = await Category.findAll();
    console.log('--- CATEGORÍAS ---');
    cats.forEach(c => console.log(`ID: ${c.id}, Desc: ${c.descripcion}`));

    const prods = await Product.findAll({ limit: 10 });
    console.log('\n--- PRODUCTOS (Primeros 10) ---');
    prods.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, CatID: ${p.categoria_id}`));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
