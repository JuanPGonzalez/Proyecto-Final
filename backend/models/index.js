const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const { Order, OrderItem } = require('./Order');
const ComponenteML = require('./ComponenteML');
const LogMotorPrecio = require('./LogMotorPrecio');

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Componente ML relationships (Product is the componente model)
Product.hasMany(ComponenteML, { foreignKey: 'componente_id', as: 'mlItems' });
ComponenteML.belongsTo(Product, { foreignKey: 'componente_id' });

// Pricing logs
Product.hasMany(LogMotorPrecio, { foreignKey: 'componente_id', as: 'pricingLogs' });
LogMotorPrecio.belongsTo(Product, { foreignKey: 'componente_id' });

module.exports = { sequelize, User, Product, Order, OrderItem, ComponenteML, LogMotorPrecio };
