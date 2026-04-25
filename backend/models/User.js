const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  tipo_usuario: { type: DataTypes.STRING, allowNull: false, defaultValue: 'cliente', field: 'tipo_usuario' },
  fecha_reg: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'fecha_reg' },
  sexo: { type: DataTypes.STRING, defaultValue: 'Indefinido', field: 'sexo' },
  fecha_nac: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'fecha_nac' },
  direccion: { type: DataTypes.STRING, defaultValue: 'Desconocida', field: 'direccion' }
}, {
  tableName: 'user',
  timestamps: false
});

module.exports = User;
