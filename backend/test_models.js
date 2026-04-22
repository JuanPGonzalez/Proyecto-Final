const { Product, ComponenteML, sequelize } = require('./models');

async function test() {
  try {
    console.log('=== Testing Models ===\n');

    // Test 1: Can we query Product?
    console.log('1. Testing Product.findByPk(1)');
    const product = await Product.findByPk(1);
    console.log('Product:', product ? `Found (${product.name})` : 'Not found');
    console.log();

    // Test 2: Can we query ComponenteML?
    console.log('2. Testing ComponenteML.findAll');
    const ml = await ComponenteML.findAll({ limit: 5 });
    console.log('ComponenteML records:', ml.length);
    console.log();

    // Test 3: Try to create a ComponenteML entry
    console.log('3. Testing ComponenteML.create with component_id = 1');
    try {
      const created = await ComponenteML.create({
        componente_id: 1,
        ml_id: 'MLA123'
      });
      console.log('✅ Created:', created.toJSON());
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  process.exit(0);
}

test();
