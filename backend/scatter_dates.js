const { Sequelize, User, SupportTicket } = require('./models');

async function scatterDates() {
  try {
    const users = await User.findAll();
    let now = new Date();
    console.log('Scattering user dates...');
    for (let u of users) {
      const randomDaysAgo = Math.floor(Math.random() * 60);
      const newDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
      await u.update({ fechaReg: newDate });
    }

    const tickets = await SupportTicket.findAll();
    console.log('Scattering ticket dates and closing some...');
    for (let t of tickets) {
      const randomDaysAgo = Math.floor(Math.random() * 60);
      const newDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
      // Randomly close ~50% of the tickets
      const isClosed = Math.random() > 0.5;
      await t.update({ 
        created_at: newDate,
        status: isClosed ? 'cerrado' : 'abierto',
        respuesta: isClosed ? 'Problema resuelto automáticamente.' : null
      });
    }

    console.log('Dates and statuses scattered successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

scatterDates();
