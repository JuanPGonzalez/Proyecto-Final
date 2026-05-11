const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SYSTEM' }, // ORDER, TICKET, SYSTEM, AUTH, pedido
  reference_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  target_role: { type: DataTypes.STRING, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;
