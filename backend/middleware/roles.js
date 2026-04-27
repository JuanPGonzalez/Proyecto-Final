const jwt = require('jsonwebtoken');
const { User } = require('../models');

const ROLES = {
  ADMIN: 'administrador',
  CLIENT: 'cliente',
  LEGACY_ADMIN: 'admin',
  LEGACY_CLIENT: 'client'
};

const normalizeRole = (value) => {
  if (!value || typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if ([ROLES.ADMIN, ROLES.LEGACY_ADMIN].includes(lower)) return ROLES.ADMIN;
  if ([ROLES.CLIENT, ROLES.LEGACY_CLIENT].includes(lower)) return ROLES.CLIENT;
  return null;
};

const isAdminRole = (value) => normalizeRole(value) === ROLES.ADMIN;
const isClientRole = (value) => normalizeRole(value) === ROLES.CLIENT;

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // VERIFICACIÓN DEFINITIVA: ¿Existe el usuario en la DB?
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Sesión expirada o usuario inexistente. Por favor re-inicie sesión.' });
    }

    req.user = {
      ...decoded,
      tipoUsuario: decoded.tipoUsuario || decoded.tipo_usuario,
      tipo_usuario: decoded.tipo_usuario || decoded.tipoUsuario
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const adminMiddleware = [
  authMiddleware,
  (req, res, next) => {
    if (!isAdminRole(req.user.tipoUsuario)) {
      return res.status(403).json({ error: 'Prohibido: se requiere rol de administrador' });
    }
    next();
  }
];

const clientMiddleware = [
  authMiddleware,
  (req, res, next) => {
    if (!isClientRole(req.user.tipoUsuario)) {
      return res.status(403).json({ error: 'Prohibido: se requiere rol de cliente' });
    }
    next();
  }
];

module.exports = { authMiddleware, adminMiddleware, clientMiddleware, ROLES, isAdminRole, isClientRole, normalizeRole };
