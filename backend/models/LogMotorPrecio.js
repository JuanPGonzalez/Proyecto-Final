const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogMotorPrecio = sequelize.define('LogMotorPrecio', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  componente_id: { type: DataTypes.INTEGER, allowNull: false },
  precio_anterior: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  precio_nuevo: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  precio_sugerido: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  precio_competencia: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  estado: {
    type: DataTypes.ENUM('success', 'warning', 'error', 'pending'),
    defaultValue: 'pending'
  },
  detalle: { type: DataTypes.TEXT, allowNull: true },
  razon_rechazo: { type: DataTypes.STRING, allowNull: true },
  validaciones: { type: DataTypes.JSON, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'log_motor_precio',
  timestamps: false,
  indexes: [
    { fields: ['componente_id'] }
  ]
});

module.exports = LogMotorPrecio;
