const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { authMiddleware, adminMiddleware, ROLES, isAdminRole, isClientRole } = require('../middleware/roles');

const router = express.Router();

// Admin only: see all users
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'tipoUsuario', 'sexo', 'direccion', 'fechaNac', 'fechaReg']
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Admin only: create administrador or cliente users manually
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, tipoUsuario } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya en uso' });

    const normalizedRole = isAdminRole(tipoUsuario) ? ROLES.ADMIN : ROLES.CLIENT;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, tipoUsuario: normalizedRole });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
      tipo_usuario: user.tipoUsuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario administrador' });
  }
});

module.exports = router;
