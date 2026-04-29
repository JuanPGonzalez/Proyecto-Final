const { Product, Category } = require('../models');

async function test() {
  const p = await Product.findOne({ include: [Category] });
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
}
test();
