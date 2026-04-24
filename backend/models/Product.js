const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imgURL: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'imgURL' // Corregido de img_url a imgURL para coincidir con la DB
  },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  categoria_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'componente',
  timestamps: false
});

module.exports = Product;
