const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imgURL: { type: DataTypes.STRING, allowNull: true },
  
  // Agregar price/stock ficticios o acoplarlos localmente ya que old DB usaba una tabla de precio separada.
  // Para integrarlo todo sin reescribir un macro-sistema, agregaremos columnas a "componente" o usaremos un mock si no existen.
  // Agregaremos price y stock por simplicidad para la demo si Sequelize usa alter:true.
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  views: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'componente',
  timestamps: false
});

module.exports = Product;
