const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function test() {
  try {
    console.log('=== Testing Hardware Haven API ===\n');

    // Test 1: Test endpoint
    console.log('1. Testing GET /test');
    const testRes = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Response:', testRes.data);
    console.log();

    // Test 2: Try to POST ML mapping (will fail if no component)
    console.log('2. Testing POST /api/componentes/1/ml-mapping');
    try {
      const postRes = await axios.post(`${BASE_URL}/api/componentes/1/ml-mapping`, {
        ids: ['MLA1617800563',
            'MLA1339807170',
            'MLA1677927445']
      });
      console.log('✅ Response:', postRes.data);
    } catch (error) {
      console.log('⚠️ Response:', error.response?.data || error.message);
    }
    console.log();

    // Test 3: Try to GET ML mappings
    console.log('3. Testing GET /api/componentes/1/ml-mapping');
    try {
      const getRes = await axios.get(`${BASE_URL}/api/componentes/1/ml-mapping`);
      console.log('✅ Response:', getRes.data);
    } catch (error) {
      console.log('⚠️ Response:', error.response?.data || error.message);
    }
    console.log();

    // Test 4: Invalid request (ids not array)
    console.log('4. Testing POST with invalid data (ids not array)');
    try {
      const invalidRes = await axios.post(`${BASE_URL}/api/componentes/1/ml-mapping`, {
        ids: 'MLA1677927445'
      });
      console.log('Response:', invalidRes.data);
    } catch (error) {
      console.log('✅ Correctly rejected:', error.response?.data);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }

  process.exit(0);
}

test();
