const { Category } = require('./models');

async function checkCategories() {
  try {
    const cats = await Category.findAll();
    console.log('Categorías encontradas:', cats.length);
    cats.forEach(c => console.log(`- [${c.id}] ${c.nombre}`));
    
    if (cats.length === 0) {
      console.log('Sembrando categorías básicas...');
      await Category.bulkCreate([
        { nombre: 'Procesadores' },
        { nombre: 'Placas de Video' },
        { nombre: 'Memorias RAM' },
        { nombre: 'Almacenamiento' },
        { nombre: 'Fuentes de Poder' },
        { nombre: 'Gabinetes' },
        { nombre: 'Motherboards' },
        { nombre: 'Refrigeración' },
        { nombre: 'Periféricos' }
      ]);
      console.log('Categorías sembradas con éxito.');
    }
  } catch (e) {
    console.error('Error al verificar categorías:', e.message);
  } finally {
    process.exit();
  }
}

checkCategories();
