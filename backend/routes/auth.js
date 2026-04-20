const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, tipoUsuario } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya en uso' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, tipoUsuario: tipoUsuario || 'client' });
    
    const token = jwt.sign({ id: user.id, tipoUsuario: user.tipoUsuario }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, tipoUsuario: user.tipoUsuario } });
  } catch (error) {
    res.status(500).json({ error: 'Error registrando: ' + error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, tipoUsuario: user.tipoUsuario }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, tipoUsuario: user.tipoUsuario } });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
});

// Profile - Obtener datos del usuario logeado
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Profile - Actualizar
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, sexo, direccion, fechaNac } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (name) user.name = name;
    if (sexo) user.sexo = sexo;
    if (direccion) user.direccion = direccion;
    if (fechaNac) user.fechaNac = fechaNac;

    await user.save();
    res.json({ success: true, user: { id: user.id, name: user.name, tipoUsuario: user.tipoUsuario, direccion: user.direccion, sexo: user.sexo, fechaNac: user.fechaNac } });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;
