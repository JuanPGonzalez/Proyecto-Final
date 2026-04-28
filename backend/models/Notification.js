const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SYSTEM' }, // ORDER, TICKET, SYSTEM, AUTH
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;
