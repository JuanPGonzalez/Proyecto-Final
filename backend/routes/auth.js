const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
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
      tipo_usuario: ROLES.CLIENT,
      fecha_reg: new Date()
    });

    const token = jwt.sign(
      { id: user.id, tipo_usuario: user.tipo_usuario },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipo_usuario
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
      { id: user.id, tipo_usuario: user.tipo_usuario },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipo_usuario
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
      tipo_usuario: user.tipo_usuario
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Profile - Actualizar
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, sexo, direccion, fecha_nac } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (name) user.name = name;
    if (sexo) user.sexo = sexo;
    if (direccion) user.direccion = direccion;
    if (fecha_nac) user.fecha_nac = fecha_nac;

    await user.save();
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        direccion: user.direccion,
        sexo: user.sexo,
        fecha_nac: user.fecha_nac
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;
