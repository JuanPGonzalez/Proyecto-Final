const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware, adminMiddleware, ROLES, isAdminRole, isClientRole } = require('../middleware/roles');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Register endpoint hit', { name, email });
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya en uso' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tipoUsuario: ROLES.CLIENT,
      fechaReg: new Date()
    });

    // Welcome Notification for new user
    await Notification.create({
      user_id: user.id,
      message: `¡Bienvenido a Hardware Haven, ${user.name}! Gracias por registrarte.`,
      type: 'AUTH'
    });

    // Notify all admins about new registration
    const admins = await User.findAll({ where: { tipoUsuario: ROLES.ADMIN } });
    const adminNotifications = admins.map(admin => ({
      user_id: admin.id,
      message: `Nuevo usuario registrado: ${user.name} (${user.email}).`,
      type: 'SYSTEM'
    }));
    if (adminNotifications.length > 0) {
      await Notification.bulkCreate(adminNotifications);
    }

    const token = jwt.sign(
      { id: user.id, tipo_usuario: user.tipoUsuario },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipoUsuario
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { name: identifier }
        ]
      }
    });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, tipo_usuario: user.tipoUsuario },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipoUsuario
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en login' });
  }
});

// Profile - Obtener datos del usuario logeado
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({
      ...user.toJSON(),
      tipo_usuario: user.tipoUsuario
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Profile - Actualizar
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, sexo, direccion, fechaNac, dni } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (name) user.name = name;
    if (sexo) user.sexo = sexo;
    if (direccion) user.direccion = direccion;
    if (fechaNac) user.fechaNac = fechaNac;
    
    if (dni !== undefined && dni !== '' && dni !== null) {
      const numericDni = Number(dni);
      // Verificar colisión
      const alreadyUsed = await User.findOne({ 
        where: { 
          dni: numericDni,
          id: { [Op.ne]: req.user.id } 
        } 
      });
      if (alreadyUsed) {
        return res.status(400).json({ error: 'Este número de documento ya está registrado por otro usuario.' });
      }
      user.dni = numericDni;
    } else if (dni === '' || dni === null) {
      user.dni = null;
    }

    await user.save();
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipoUsuario,
        direccion: user.direccion,
        sexo: user.sexo,
        fechaNac: user.fechaNac,
        dni: user.dni
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;
