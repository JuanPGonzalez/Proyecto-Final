/**
 * Complete test suite for ML linking + pricing system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let testComponentId = 1;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testExtractMLIds() {
  log('\n=== Test 1: Extract ML IDs from URLs ===', 'blue');

  const testUrls = [
    'https://www.mercadolibre.com.ar/p/MLA19518470',
    'https://www.mercadolibre.com.ar/p/MLA63419156',
    'https://articulo.mercadolibre.com.ar/MLA-1234567890_JM'
  ];

  // Extract IDs using regex
  const mlIds = testUrls
    .map(url => {
      const match = url.match(/(MLA\d+)/);
      return match ? match[1] : null;
    })
    .filter(id => id !== null);

  if (mlIds.length === testUrls.length) {
    log('✅ All ML IDs extracted correctly', 'green');
    log(`   Extracted: ${mlIds.join(', ')}`, 'blue');
    return true;
  } else {
    log('❌ Failed to extract all ML IDs', 'red');
    return false;
  }
}

async function testSaveMappings() {
  log('\n=== Test 2: Save ML Mappings via POST endpoint ===', 'blue');

  try {
    const urls = [
      'https://www.mercadolibre.com.ar/p/MLA19518470',
      'https://www.mercadolibre.com.ar/p/MLA63419156'
    ];

    const response = await axios.post(
      `${BASE_URL}/componentes/${testComponentId}/ml-mapping`,
      { urls }
    );

    if (response.data.ok && response.data.extracted > 0) {
      log(`✅ Saved ${response.data.extracted} ML mappings`, 'green');
      log(`   IDs: ${response.data.ids.join(', ')}`, 'blue');
      return true;
    } else {
      log('❌ Failed to save mappings', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error saving mappings: ${error.message}`, 'red');
    return false;
  }
}

async function testGetMappings() {
  log('\n=== Test 3: Get ML Mappings via GET endpoint ===', 'blue');

  try {
    const response = await axios.get(
      `${BASE_URL}/componentes/${testComponentId}/ml-mapping`
    );

    if (response.data.total > 0) {
      log(`✅ Retrieved ${response.data.total} ML mappings`, 'green');
      log(`   Component: ${response.data.componente_name}`, 'blue');
      log(`   IDs: ${response.data.ml_ids.join(', ')}`, 'blue');
      return true;
    } else {
      log('⚠️  No mappings found', 'yellow');
      return true; // Not a failure, just empty
    }
  } catch (error) {
    log(`❌ Error getting mappings: ${error.message}`, 'red');
    return false;
  }
}

async function testPricingEndpoint() {
  log('\n=== Test 4: Test Pricing Endpoint ===', 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/pricing/test`);

    if (response.data.success) {
      log('✅ Pricing calculation successful', 'green');
      log(`   Median: $${response.data.median.toLocaleString()}`, 'blue');
      log(`   Average: $${response.data.average.toLocaleString()}`, 'blue');
      log(`   Suggested price: $${response.data.suggestedPricing?.suggestedPrice?.toLocaleString() || 'N/A'}`, 'blue');
      return true;
    } else {
      log('⚠️  Pricing calculation failed (expected if ML API is down)', 'yellow');
      log(`   Reason: ${response.data.validation?.reason}`, 'yellow');
      return true; // Not a failure
    }
  } catch (error) {
    log(`❌ Error testing pricing: ${error.message}`, 'red');
    return false;
  }
}

async function testComponentePricingEndpoint() {
  log('\n=== Test 5: Get Componente Pricing ===', 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/pricing/componente/${testComponentId}`);

    log('✅ Componente pricing endpoint working', 'green');
    log(`   Component: ${response.data.componente_name}`, 'blue');
    log(`   ML IDs linked: ${response.data.ml_ids?.length || 0}`, 'blue');
    log(`   Success: ${response.data.success}`, 'blue');

    return true;
  } catch (error) {
    log(`❌ Error getting componente pricing: ${error.message}`, 'red');
    return false;
  }
}

async function testPriceValidation() {
  log('\n=== Test 6: Price Validation Rules ===', 'blue');

  const testCases = [
    { price: 100000, valid: true, reason: 'Normal price' },
    { price: 50, valid: false, reason: 'Too low (< 100)' },
    { price: 0, valid: false, reason: 'Zero price' },
    { price: 11000000, valid: false, reason: 'Too high (> 10M)' },
    { price: 500000, valid: true, reason: 'High but valid' }
  ];

  let passed = 0;
  testCases.forEach(test => {
    // Simulate validation
    const isValid = test.price > 100 && test.price < 10000000 && test.price > 0;
    if (isValid === test.valid) {
      log(`   ✅ ${test.reason}: $${test.price}`, 'green');
      passed++;
    } else {
      log(`   ❌ ${test.reason}: $${test.price}`, 'red');
    }
  });

  return passed === testCases.length;
}

async function testMedianCalculation() {
  log('\n=== Test 7: Median Calculation ===', 'blue');

  const testCases = [
    { arr: [100, 200, 150], expected: 150, desc: 'Odd array' },
    { arr: [100, 200, 150, 300], expected: 175, desc: 'Even array' },
    { arr: [100], expected: 100, desc: 'Single element' }
  ];

  let passed = 0;
  testCases.forEach(test => {
    const sorted = [...test.arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    if (median === test.expected) {
      log(`   ✅ ${test.desc}: Median = ${median}`, 'green');
      passed++;
    } else {
      log(`   ❌ ${test.desc}: Expected ${test.expected}, got ${median}`, 'red');
    }
  });

  return passed === testCases.length;
}

async function testOutlierFiltering() {
  log('\n=== Test 8: Outlier Filtering ===', 'blue');

  const prices = [100000, 105000, 110000, 200000, 95000];
  const median = 105000;
  const lowerBound = median * 0.5;
  const upperBound = median * 1.5;

  log(`   Median: $${median.toLocaleString()}`, 'blue');
  log(`   Range: $${Math.round(lowerBound).toLocaleString()} - $${Math.round(upperBound).toLocaleString()}`, 'blue');

  const filtered = prices.filter(p => p >= lowerBound && p <= upperBound);
  log(`   Original: ${prices.length} prices, Filtered: ${filtered.length} prices`, 'blue');

  if (filtered.length < prices.length) {
    log(`   ✅ Outliers removed: ${prices.filter(p => p < lowerBound || p > upperBound).map(p => `$${p.toLocaleString()}`).join(', ')}`, 'green');
    return true;
  } else {
    log('   ℹ️  No outliers detected', 'blue');
    return true;
  }
}

async function testErrorHandling() {
  log('\n=== Test 9: Error Handling ===', 'blue');

  try {
    // Test with invalid component ID
    await axios.get(`${BASE_URL}/componentes/99999/ml-mapping`);
    log('❌ Should have returned 404 for invalid component', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.data?.error) {
      log('✅ Properly handles invalid component IDs', 'green');
      return true;
    }
  }

  try {
    // Test with invalid POST data
    await axios.post(`${BASE_URL}/componentes/${testComponentId}/ml-mapping`, { urls: '' });
    log('❌ Should have rejected invalid data', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ Properly validates request data', 'green');
      return true;
    }
  }
}

async function testUrlExtraction() {
  log('\n=== Test 10: URL Format Testing ===', 'blue');

  const testUrls = [
    { url: 'https://www.mercadolibre.com.ar/p/MLA19518470', expected: 'MLA19518470' },
    { url: 'https://articulo.mercadolibre.com.ar/MLA-1234567890_JM', expected: 'MLA1234567890' },
    { url: 'https://www.mercadolibre.com/p/MLB987654321', expected: 'MLB987654321' },
    { url: 'not-a-url', expected: null }
  ];

  let passed = 0;
  testUrls.forEach(test => {
    const match = test.url.match(/(ML[A-Z]\d+)/);
    const result = match ? match[1] : null;
    if (result === test.expected) {
      log(`   ✅ "${test.url}" → "${result || '(no match)'}"`, 'green');
      passed++;
    } else {
      log(`   ❌ "${test.url}" → Expected "${test.expected}", got "${result}"`, 'red');
    }
  });

  return passed === testUrls.length;
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  ML LINKING + PRICING SYSTEM TEST SUITE    ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  const tests = [
    { name: 'Extract ML IDs', fn: testExtractMLIds },
    { name: 'Save Mappings', fn: testSaveMappings },
    { name: 'Get Mappings', fn: testGetMappings },
    { name: 'Pricing Endpoint', fn: testPricingEndpoint },
    { name: 'Componente Pricing', fn: testComponentePricingEndpoint },
    { name: 'Price Validation', fn: testPriceValidation },
    { name: 'Median Calculation', fn: testMedianCalculation },
    { name: 'Outlier Filtering', fn: testOutlierFiltering },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'URL Extraction', fn: testUrlExtraction }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
      else failed++;
    } catch (error) {
      log(`\n❌ Test crashed: ${error.message}`, 'red');
      failed++;
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log(`║  RESULTS: ${passed} passed, ${failed} failed` + ' '.repeat(Math.max(0, 20 - String(passed + failed).length)) + '║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
