const { Province, Locality, sequelize } = require('../models');

async function seedGeo() {
  try {
    console.log('--- Iniciando Carga de Provincias y Localidades (Argentina) ---');
    
    // Desactivar temporalmente constraints para limpiar tablas
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Province.destroy({ where: {}, truncate: true });
    await Locality.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const provinces = [
      { nombre: 'Buenos Aires' },
      { nombre: 'CABA' },
      { nombre: 'Santa Fe' },
      { nombre: 'Córdoba' },
      { nombre: 'Mendoza' },
      { nombre: 'Tucumán' },
      { nombre: 'Entre Ríos' },
      { nombre: 'Salta' },
      { nombre: 'Misiones' },
      { nombre: 'Chaco' },
      { nombre: 'Corrientes' },
      { nombre: 'San Juan' },
      { nombre: 'Jujuy' },
      { nombre: 'Río Negro' },
      { nombre: 'Neuquén' },
      { nombre: 'Formosa' },
      { nombre: 'Chubut' },
      { nombre: 'San Luis' },
      { nombre: 'Catamarca' },
      { nombre: 'La Rioja' },
      { nombre: 'La Pampa' },
      { nombre: 'Santa Cruz' },
      { nombre: 'Tierra del Fuego' },
      { nombre: 'Santiago del Estero' }
    ];

    const createdProvinces = await Province.bulkCreate(provinces);
    console.log(`Cargadas ${createdProvinces.length} provincias.`);

    const santaFe = createdProvinces.find(p => p.nombre === 'Santa Fe');
    const buenosAires = createdProvinces.find(p => p.nombre === 'Buenos Aires');
    const caba = createdProvinces.find(p => p.nombre === 'CABA');
    const cordoba = createdProvinces.find(p => p.nombre === 'Córdoba');

    const localities = [
      // Santa Fe
      { nombre: 'Rosario', codigo_postal: '2000', precio_envio: 1500.00, provincia_id: santaFe.id },
      { nombre: 'Santa Fe Capital', codigo_postal: '3000', precio_envio: 2500.00, provincia_id: santaFe.id },
      { nombre: 'Venado Tuerto', codigo_postal: '2600', precio_envio: 3500.00, provincia_id: santaFe.id },
      
      // Buenos Aires
      { nombre: 'La Plata', codigo_postal: '1900', precio_envio: 4500.00, provincia_id: buenosAires.id },
      { nombre: 'Mar del Plata', codigo_postal: '7600', precio_envio: 6500.00, provincia_id: buenosAires.id },
      { nombre: 'Bahía Blanca', codigo_postal: '8000', precio_envio: 7000.00, provincia_id: buenosAires.id },
      
      // CABA
      { nombre: 'Palermo', codigo_postal: '1425', precio_envio: 4000.00, provincia_id: caba.id },
      { nombre: 'Microcentro', codigo_postal: '1000', precio_envio: 4000.00, provincia_id: caba.id },
      
      // Córdoba
      { nombre: 'Córdoba Capital', codigo_postal: '5000', precio_envio: 3500.00, provincia_id: cordoba.id },
      { nombre: 'Villa Carlos Paz', codigo_postal: '5152', precio_envio: 4200.00, provincia_id: cordoba.id }
    ];

    await Locality.bulkCreate(localities);
    console.log(`Cargadas ${localities.length} localidades principales.`);

    console.log('--- CARGA GEOGRÁFICA COMPLETADA ---');
    process.exit(0);
  } catch (error) {
    console.error('Error cargando datos geográficos:', error);
    process.exit(1);
  }
}

seedGeo();
