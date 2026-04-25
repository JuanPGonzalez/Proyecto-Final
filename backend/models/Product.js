const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), field: 'precio_actual', allowNull: true, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, field: 'stock', allowNull: true, defaultValue: 0 },
  views: { type: DataTypes.INTEGER, field: 'views', allowNull: true, defaultValue: 0 },
  imgURL: { type: DataTypes.STRING, field: 'img_url', allowNull: true },
  categoria_id: { type: DataTypes.INTEGER.UNSIGNED, field: 'categoria_id', allowNull: false }
}, {
  tableName: 'componente',
  timestamps: false
});

module.exports = Product;
