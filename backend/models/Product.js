const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imgURL: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'img_url'
  },
  categoria_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'componente',
  timestamps: false
});

module.exports = Product;
