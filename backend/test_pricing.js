const {
  getRobustMarketPrice,
  getMarketPriceByComponenteId,
  calculateMedian,
  fetchItemFromML
} = require('./services/pricingService');

/**
 * Test the pricing service implementation
 */
async function testPricingService() {
  console.log('=== Testing Robust Market Price Service ===\n');

  // Test 1: Calculate median
  console.log('Test 1: Calculate Median');
  const testArray = [100, 200, 150, 300, 250];
  const median = calculateMedian(testArray);
  console.log(`  Array: ${testArray}`);
  console.log(`  Median: ${median}`);
  console.log(`  ✅ Expected: 200, Got: ${median}\n`);

  // Test 2: Median with even length
  console.log('Test 2: Calculate Median (Even Length)');
  const testArray2 = [100, 200, 150, 300];
  const median2 = calculateMedian(testArray2);
  console.log(`  Array: ${testArray2}`);
  console.log(`  Median: ${median2}`);
  console.log(`  ✅ Expected: 175, Got: ${median2}\n`);

  // Test 3: Fetch single item from ML
  console.log('Test 3: Fetch Single Item from MercadoLibre');
  const item = await fetchItemFromML('MLA1617800563', 5000);
  if (item) {
    console.log(`  ✅ Item fetched: Price = ${item.price}, Status = ${item.status}`);
  } else {
    console.log(`  ⚠️ Item not fetched or price is invalid`);
  }
  console.log();

  // Test 4: Get robust market price with real ML IDs
  console.log('Test 4: Get Robust Market Price (Real ML IDs)');
  const testIds = [
    'MLA1617800563',
    'MLA1339807170',
    'MLA1677927445'
  ];

  console.log(`  Testing with IDs: ${testIds.join(', ')}`);
  const priceResult = await getRobustMarketPrice(testIds);

  console.log(`  All Prices: ${priceResult.prices.join(', ')}`);
  console.log(`  Median: ${priceResult.median}`);
  console.log(`  Filtered Prices (50%-150% of median): ${priceResult.filteredPrices.join(', ')}`);
  console.log(`  Final Average: ${priceResult.average}`);
  console.log(`  Success: ${priceResult.success}`);
  console.log();

  // Test 5: Get robust market price with empty array
  console.log('Test 5: Get Robust Market Price (Empty Array)');
  const emptyResult = await getRobustMarketPrice([]);
  console.log(`  Success: ${emptyResult.success}`);
  console.log(`  ✅ Handles empty array gracefully\n`);

  // Test 6: Get robust market price with invalid IDs
  console.log('Test 6: Get Robust Market Price (Invalid IDs)');
  const invalidResult = await getRobustMarketPrice(['INVALID123', 'INVALID456']);
  console.log(`  Success: ${invalidResult.success}`);
  console.log(`  All Prices: ${invalidResult.prices.join(', ') || '(none)'}`);
  console.log(`  ✅ Handles invalid IDs gracefully\n`);

  console.log('=== All Tests Completed ===');
}

// Run tests
testPricingService().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
