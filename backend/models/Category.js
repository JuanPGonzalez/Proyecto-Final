const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'categoria',
  timestamps: false
});

module.exports = Category;
