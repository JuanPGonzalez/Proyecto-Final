const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  tipoUsuario: { type: DataTypes.STRING, allowNull: false, defaultValue: 'cliente', field: 'tipo_usuario' },
  fechaReg: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'fecha_reg' },
  sexo: { type: DataTypes.STRING, defaultValue: 'Indefinido', field: 'sexo' },
  fechaNac: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'fecha_nac' },
  direccion: { type: DataTypes.STRING, defaultValue: 'Desconocida', field: 'direccion' },
  dni: { type: DataTypes.INTEGER, allowNull: true, field: 'dni' }
}, {
  tableName: 'users',
  timestamps: false
});

module.exports = User;
