const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/products');
    const products = res.data;
    const placeholders = products.filter(p => p.imgURL && p.imgURL.includes('placeholder'));
    console.log('--- TEST DE IMÁGENES ---');
    console.log('Total Productos:', products.length);
    console.log('Placeholders en respuesta API:', placeholders.length);
    if (products.length > 0) {
      console.log('Ejemplo de URL:', products[0].imgURL);
    }
  } catch (err) {
    console.error('Error en el test:', err.message);
  }
}

test();
