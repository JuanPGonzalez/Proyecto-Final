const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const { Order, OrderItem } = require('./Order');
const ComponenteML = require('./ComponenteML');
const LogMotorPrecio = require('./LogMotorPrecio');
const SupportTicket = require('./SupportTicket');
const UserView = require('./UserView');
const Notification = require('./Notification');

const Category = require('./Category');

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'compra_id' });
OrderItem.belongsTo(Order, { foreignKey: 'compra_id' });

Product.hasMany(OrderItem, { foreignKey: 'componente_id' });
OrderItem.belongsTo(Product, { foreignKey: 'componente_id' });

// Category relationships
Category.hasMany(Product, { foreignKey: 'categoria_id' });
Product.belongsTo(Category, { foreignKey: 'categoria_id' });

// Componente ML relationships (Product is the componente model) # oklch(0.6 0.2 150)
Product.hasMany(ComponenteML, { foreignKey: 'componente_id', as: 'mlItems' });
ComponenteML.belongsTo(Product, { foreignKey: 'componente_id' });

// Pricing logs
Product.hasMany(LogMotorPrecio, { foreignKey: 'componente_id', as: 'pricingLogs' });
LogMotorPrecio.belongsTo(Product, { foreignKey: 'componente_id' });

// Support tickets
User.hasMany(SupportTicket, { foreignKey: 'user_id', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User Views (for recommendations)
User.hasMany(UserView, { foreignKey: 'user_id' });
UserView.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(UserView, { foreignKey: 'product_id' });
UserView.belongsTo(Product, { foreignKey: 'product_id' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Product, Order, OrderItem, ComponenteML, LogMotorPrecio, SupportTicket, UserView, Category, Notification };
