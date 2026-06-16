const { Order, OrderItem, Product, sequelize } = require('./models');

async function fixMissingOrderItems() {
  // 1. Delete bad items created by previous run (they have compra_id = NULL)
  const deleted = await sequelize.query(
    'DELETE FROM linea_compra WHERE compra_id IS NULL',
    { type: sequelize.constructor.QueryTypes.DELETE }
  );
  console.log(`Eliminados items huérfanos (sin compra_id): OK`);

  // 2. Get all orders with their items
  const orders = await Order.findAll({ include: [OrderItem] });
  const products = await Product.findAll();

  if (products.length === 0) {
    console.log('No hay productos en la BD para asignar.');
    process.exit(0);
  }

  let fixedCount = 0;

  for (let o of orders) {
    if (!o.OrderItems || o.OrderItems.length === 0) {
      // Pick a random product
      const product = products[Math.floor(Math.random() * products.length)];

      const subtotal = Math.max(
        (Number(o.total) || 0) - (Number(o.shipping_cost) || 0),
        100
      );

      await OrderItem.create({
        compra_id: o.id,
        componente_id: product.id,
        quantity: 1,
        priceAtPurchase: subtotal
      });
      fixedCount++;
    }
  }

  console.log(`Se arreglaron ${fixedCount} órdenes sin productos asignándoles un producto aleatorio.`);
  process.exit(0);
}

fixMissingOrderItems().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
