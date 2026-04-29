const { sequelize, Province, Locality } = require('./models');

async function seed() {
  try {
    // Only force sync the relevant models to avoid FK issues with other tables
    await Province.sync({ force: true, cascade: true });
    await Locality.sync({ force: true, cascade: true });

    const santaFe = await Province.create({ nombre: 'Santa Fe' });
    const buenosAires = await Province.create({ nombre: 'Buenos Aires' });

    await Locality.bulkCreate([
      { nombre: 'Rosario', codigo_postal: '2000', precio_envio: 3000, provincia_id: santaFe.id },
      { nombre: 'Santa Fe', codigo_postal: '3000', precio_envio: 3500, provincia_id: santaFe.id },
      { nombre: 'CABA', codigo_postal: '1000', precio_envio: 4000, provincia_id: buenosAires.id },
      { nombre: 'La Plata', codigo_postal: '1900', precio_envio: 4200, provincia_id: buenosAires.id }
    ]);

    console.log('Shipping data seeded successfully with new structure!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding shipping data:', error);
    process.exit(1);
  }
}

seed();
