export const ROLES = {
  ADMIN: 'administrador',
  CLIENT: 'cliente',
  LEGACY_ADMIN: 'admin',
  LEGACY_CLIENT: 'client'
};

export const getUserRole = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.tipoUsuario || value.tipo_usuario || '';
};

export const isAdminRole = (value) => {
  const role = getUserRole(value).toLowerCase();
  return [ROLES.ADMIN, ROLES.LEGACY_ADMIN].includes(role);
};

export const isClientRole = (value) => {
  const role = getUserRole(value).toLowerCase();
  return [ROLES.CLIENT, ROLES.LEGACY_CLIENT].includes(role);
};

export const normalizeRole = (value) => {
  const role = getUserRole(value).toLowerCase();
  if (isAdminRole(role)) return ROLES.ADMIN;
  if (isClientRole(role)) return ROLES.CLIENT;
  return role;
};
