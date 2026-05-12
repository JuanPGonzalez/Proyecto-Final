const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection successful. Checking column...');
    
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.dni) {
      const { DataTypes } = require('sequelize');
      console.log('Adding column "dni" as INTEGER to table "users"...');
      await queryInterface.addColumn('users', 'dni', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
      console.log('Column added successfully!');
    } else {
      console.log('Column "dni" already exists.');
    }
  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    await sequelize.close();
  }
}

migrate();
