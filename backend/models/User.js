const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  tipoUsuario: { type: DataTypes.STRING, allowNull: false, defaultValue: 'client' },
  fechaReg: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  sexo: { type: DataTypes.STRING, defaultValue: 'Indefinido' },
  fechaNac: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  direccion: { type: DataTypes.STRING, defaultValue: 'Desconocida' }
}, {
  tableName: 'user',
  timestamps: false // asumiendo que sus entidades no usan createdAt/updatedAt a menos que extendan algo, pero user tiene fechaReg, no updatedAt. Si rompe se ajusta.
});

module.exports = User;
