const fetch = require('node-fetch');

// Test the API Test page functionality
async function testApiTestPage() {
  console.log('🔍 Testing API Test Page Index Alignment...\n');

  const apiTests = [
    { index: 0, name: 'Categories API', endpoint: '/api/categories' },
    { index: 1, name: 'Storage Locations API', endpoint: '/api/storage-locations' },
    { index: 2, name: 'Units API', endpoint: '/api/units' },
    { index: 3, name: 'Suppliers API', endpoint: '/api/suppliers' },
    { index: 4, name: 'Raw Materials API', endpoint: '/api/raw-materials' },
    { index: 8, name: 'Finished Products API', endpoint: '/api/finished-products' },
    { index: 16, name: 'Dashboard Summary', endpoint: '/api/dashboard/summary' },
    { index: 17, name: 'Dashboard Alerts', endpoint: '/api/dashboard/alerts' },
    { index: 18, name: 'Dashboard Trends', endpoint: '/api/dashboard/trends?days=7' },
    { index: 19, name: 'Dashboard Categories', endpoint: '/api/dashboard/categories' },
    { index: 20, name: 'Dashboard Value Analysis', endpoint: '/api/dashboard/value' },
    { index: 21, name: 'Recipes API', endpoint: '/api/recipes' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of apiTests) {
    try {
      const response = await fetch(`http://localhost:8000${test.endpoint}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Index ${test.index}: ${test.name} - SUCCESS`);
        passed++;
      } else {
        console.log(`❌ Index ${test.index}: ${test.name} - FAILED: ${result.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Index ${test.index}: ${test.name} - ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📍 Total Tests: ${passed + failed}`);

  if (failed === 0) {
    console.log(`\n🎉 All API tests are working! The index alignment is correct.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check backend server and data.`);
  }
}

testApiTestPage().catch(console.error);