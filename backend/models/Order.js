const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_compra: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { 
    type: DataTypes.ENUM('Pendiente', 'Cerrada', 'Cancelada'), 
    defaultValue: 'Pendiente',
    allowNull: false 
  },
  shipping_address: { type: DataTypes.STRING, allowNull: true },
  shipping_method: { type: DataTypes.STRING, allowNull: true },
  shipping_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5000 }
}, {
  tableName: 'compra',
  timestamps: false
});

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    field: 'cantidad'
  },
  priceAtPurchase: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false,
    field: 'sub_total'
  },
  compra_id: { type: DataTypes.INTEGER.UNSIGNED, field: 'compra_id' },
  componente_id: { type: DataTypes.INTEGER.UNSIGNED, field: 'componente_id' }
}, {
  tableName: 'linea_compra',
  timestamps: false
});

module.exports = { Order, OrderItem };
