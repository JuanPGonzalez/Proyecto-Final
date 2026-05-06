const { User, SupportTicket } = require('../models');

async function reassignTickets() {
  try {
    console.log('--- Reasignando Tickets a Admin_Pablo ---');
    
    const adminPablo = await User.findOne({ where: { name: 'Admin_Pablo' } });
    if (!adminPablo) {
      console.error('No se encontró a Admin_Pablo');
      process.exit(1);
    }

    // Buscar tickets que estén Respondidos o Cerrados y que no sean de él (o simplemente agarrar algunos)
    const tickets = await SupportTicket.findAll({
      where: {
        status: 'cerrado'
      },
      limit: 15
    });

    console.log(`Reasignando ${tickets.length} tickets...`);

    for (const ticket of tickets) {
      await ticket.update({
        admin_id: adminPablo.id,
        respuesta: 'Ticket procesado por Admin_Pablo. Solución aplicada.'
      });
    }

    console.log('--- REASIGNACIÓN COMPLETADA ---');
    process.exit(0);
  } catch (error) {
    console.error('Error reasignando tickets:', error);
    process.exit(1);
  }
}

reassignTickets();
