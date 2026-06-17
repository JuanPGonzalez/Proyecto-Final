const { Op } = require('sequelize');
const { User } = require('./models');
const sequelize = require('./config/database');

async function test() {
  try {
    let user = await User.findOne({ where: { email: 'admin@hardwarehaven.com' } });
    if (user) {
      user.fechaNac = '1995-05-10';
      await user.save();
      const updatedUser = await User.findOne({ where: { email: 'admin@hardwarehaven.com' } });
      console.log("Updated fechaNac:", updatedUser.fechaNac);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}
test();
