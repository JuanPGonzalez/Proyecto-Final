const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { authMiddleware, adminMiddleware, ROLES, isAdminRole, isClientRole } = require('../middleware/roles');
const { sendPasswordResetEmail } = require('../services/emailService');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dni, direccion, fechaNac, sexo } = req.body;
    console.log('Register endpoint hit', { name, email });
    if (!name || !email || !password || !dni || !direccion || !fechaNac || !sexo) {
      return res.status(400).json({ error: 'Todos los datos personales son obligatorios' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya en uso' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tipoUsuario: ROLES.CLIENT,
      fechaReg: new Date(),
      dni: Number(dni),
      direccion,
      fechaNac,
      sexo
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
    const lowerIdentifier = identifier ? identifier.toLowerCase() : '';
    
    const user = await User.findOne({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('lower', sequelize.col('email')), lowerIdentifier),
          sequelize.where(sequelize.fn('lower', sequelize.col('name')), lowerIdentifier)
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

// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'El email es obligatorio' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't leak if email exists or not for security, just pretend it sent
      return res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    }

    // Create a one-time use token by attaching the user's current password hash to the secret.
    // If the password changes, the token automatically becomes invalid.
    const secret = (process.env.JWT_RESET_SECRET || 'fallback_reset_secret') + user.password;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${user.id}/${token}`;

    const emailSent = await sendPasswordResetEmail(user.email, resetLink);
    
    if (emailSent) {
      res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' });
    } else {
      // If email failed, log the link for development/testing so we can still use it
      console.log('RESET LINK (since email failed):', resetLink);
      res.status(500).json({ error: 'Error al enviar el correo. El enlace se generó en la consola del servidor.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error en el proceso de recuperación de contraseña' });
  }
});

// ==========================================
// RESET PASSWORD
// ==========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;
    if (!id || !token || !newPassword) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado o enlace inválido' });

    const secret = (process.env.JWT_RESET_SECRET || 'fallback_reset_secret') + user.password;
    
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ error: 'El enlace es inválido o ha expirado. Por favor solicita uno nuevo.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

module.exports = router;
