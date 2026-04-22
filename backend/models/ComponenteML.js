const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComponenteML = sequelize.define('ComponenteML', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  componente_id: { type: DataTypes.INTEGER, allowNull: false },
  ml_id: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'componente_ml',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['componente_id', 'ml_id']
    }
  ]
});

module.exports = ComponenteML;