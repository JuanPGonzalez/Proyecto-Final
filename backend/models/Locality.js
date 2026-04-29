const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Locality = sequelize.define('Locality', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  codigo_postal: { type: DataTypes.STRING, allowNull: false },
  precio_envio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  provincia_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'localidades',
  timestamps: false
});

module.exports = Locality;
