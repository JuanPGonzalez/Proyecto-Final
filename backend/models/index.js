const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const { Order, OrderItem } = require('./Order');
const ComponenteML = require('./ComponenteML');
const LogMotorPrecio = require('./LogMotorPrecio');

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'compra_id' });
OrderItem.belongsTo(Order, { foreignKey: 'compra_id' });

Product.hasMany(OrderItem, { foreignKey: 'componente_id' });
OrderItem.belongsTo(Product, { foreignKey: 'componente_id' });

// Componente ML relationships (Product is the componente model)
Product.hasMany(ComponenteML, { foreignKey: 'componente_id', as: 'mlItems' });
ComponenteML.belongsTo(Product, { foreignKey: 'componente_id' });

// Pricing logs
Product.hasMany(LogMotorPrecio, { foreignKey: 'componente_id', as: 'pricingLogs' });
LogMotorPrecio.belongsTo(Product, { foreignKey: 'componente_id' });

module.exports = { sequelize, User, Product, Order, OrderItem, ComponenteML, LogMotorPrecio };
