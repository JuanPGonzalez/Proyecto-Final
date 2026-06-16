const db = require('./models');
db.sequelize.query("ALTER TABLE log_motor_precio ADD COLUMN origen ENUM('motor', 'manual', 'masivo') DEFAULT 'motor'")
  .then(() => {
    console.log('Column added successfully');
    process.exit(0);
  })
  .catch(err => {
    console.log('Failed to add column or it already exists');
    process.exit(0);
  });
