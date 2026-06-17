const { Op } = require('sequelize');
const { User } = require('./models');
const sequelize = require('./config/database');

async function test() {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('cliente', 10);
    const existing = await User.findOne({ where: { name: 'cliente' } });
    if (!existing) {
      const user = await User.create({
        name: 'cliente',
        email: 'cliente@hardwarehaven.com',
        password: hashedPassword,
        tipoUsuario: 'cliente',
        sexo: 'Indefinido',
        fechaNac: '1990-01-01T12:00:00.000Z',
        direccion: 'Local Test',
        dni: 12345678
      });
      console.log("Cliente creado exitosamente");
    } else {
      existing.password = hashedPassword;
      await existing.save();
      console.log("Cliente actualizado exitosamente");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}
test();
