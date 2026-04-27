const sequelize = require('./config/database');

async function inspectTable() {
  try {
    const [results] = await sequelize.query("DESCRIBE categoria");
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

inspectTable();
