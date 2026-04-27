const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserView = sequelize.define('UserView', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  count: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
  tableName: 'user_views',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserView;
