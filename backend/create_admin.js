const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await User.create({
      name: 'Super',
      email: 'admin@hardwarehaven.com',
      password: hashedPassword,
      tipoUsuario: 'Administrador',
      sexo: 'Masculino',
      direccion: 'Central Técnica UTN',
      dni:40000000,
    });
    console.log('Usuario administrador creado exitosamente:');
    console.log('Email: admin@hardwarehaven.com');
    console.log('Password: admin');
  } catch (err) {
    console.error('Error al crear el administrador:', err.message);
  }
  process.exit();
}

createAdmin();
