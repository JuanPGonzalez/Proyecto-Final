const { Product, Category, sequelize } = require('../models');

async function updateImages() {
  try {
    console.log('--- Iniciando Actualización de Imágenes de Productos ---');
    
    const categories = await Category.findAll();
    
    const categoryImages = {
      'Procesadores': [
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555617766-c94804975da3?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000&auto=format&fit=crop'
      ],
      'Memorias RAM': [
        'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?q=80&w=1000&auto=format&fit=crop'
      ],
      'Motherboards': [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'
      ],
      'Placas de Video': [
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop'
      ],
      'Almacenamiento': [
        'https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?q=80&w=1000&auto=format&fit=crop'
      ],
      'Periféricos': [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop'
      ],
      'Fuentes de Poder': [
        'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1000&auto=format&fit=crop'
      ],
      'Gabinete': [
        'https://images.unsplash.com/photo-1591489383414-b41707833072?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1000&auto=format&fit=crop'
      ],
      'Refrigeración': [
        'https://images.unsplash.com/photo-1581092324396-447767352132?q=80&w=1000&auto=format&fit=crop'
      ]
    };

    const products = await Product.findAll();
    console.log(`Encontrados ${products.length} productos para actualizar.`);

    for (const product of products) {
      const category = categories.find(c => c.id === product.categoria_id);
      if (category) {
        const images = categoryImages[category.descripcion];
        if (images && images.length > 0) {
          const newImg = images[Math.floor(Math.random() * images.length)];
          console.log(`Actualizando ${product.name} (${category.descripcion}) -> ${newImg}`);
          await product.update({ imgURL: newImg });
        } else {
          console.log(`ADVERTENCIA: No hay imágenes para la categoría ${category.descripcion}`);
        }
      } else {
        console.log(`ADVERTENCIA: Producto ${product.id} no tiene categoría válida`);
      }
    }

    console.log('--- ACTUALIZACIÓN DE IMÁGENES COMPLETADA ---');
    process.exit(0);
  } catch (error) {
    console.error('Error actualizando imágenes:', error);
    process.exit(1);
  }
}

updateImages();
