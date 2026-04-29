const { User, sequelize } = require('../models');

async function updateDates() {
  try {
    console.log('--- Iniciando Actualización de Fechas de Usuarios ---');
    
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date();

    function getRandomDate(start, end) {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    const users = await User.findAll();
    console.log(`Actualizando ${users.length} usuarios con clusters...`);

    // Crear algunas fechas "pico" para que el gráfico no sea plano
    const hotDates = [];
    for (let i = 0; i < 10; i++) {
      hotDates.push(getRandomDate(startDate, endDate));
    }

    for (let i = 0; i < users.length; i++) {
      // 70% de probabilidad de caer en una fecha "pico", 30% random
      const useHotDate = Math.random() < 0.7;
      const newDate = useHotDate 
        ? hotDates[Math.floor(Math.random() * hotDates.length)]
        : getRandomDate(startDate, endDate);

      await users[i].update({
        fechaReg: newDate,
        createdAt: newDate
      }, { timestamps: false });
    }

    console.log('--- ACTUALIZACIÓN COMPLETADA ---');
    process.exit(0);
  } catch (error) {
    console.error('Error actualizando fechas:', error);
    process.exit(1);
  }
}

updateDates();
