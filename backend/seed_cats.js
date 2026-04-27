const { Category } = require('./models');

async function seedCategories() {
  try {
    const cats = await Category.findAll();
    if (cats.length === 0) {
      console.log('Sembrando categorías básicas...');
      await Category.bulkCreate([
        { descripcion: 'Procesadores' },
        { descripcion: 'Placas de Video' },
        { descripcion: 'Memorias RAM' },
        { descripcion: 'Almacenamiento' },
        { descripcion: 'Fuentes de Poder' },
        { descripcion: 'Gabinetes' },
        { descripcion: 'Motherboards' },
        { descripcion: 'Refrigeración' },
        { descripcion: 'Periféricos' }
      ]);
      console.log('Categorías sembradas con éxito.');
    } else {
      console.log('Ya existen categorías en la base de datos.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

seedCategories();
