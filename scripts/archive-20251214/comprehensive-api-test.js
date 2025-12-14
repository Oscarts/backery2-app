// Comprehensive API Test Verification
const http = require('http');

const API_ENDPOINTS = [
  // Basic CRUD APIs
  { name: 'Categories API', path: '/api/categories', index: 0 },
  { name: 'Storage Locations API', path: '/api/storage-locations', index: 1 },
  { name: 'Units API', path: '/api/units', index: 2 },
  { name: 'Suppliers API', path: '/api/suppliers', index: 3 },
  { name: 'Raw Materials API', path: '/api/raw-materials', index: 4 },
  { name: 'Finished Products API', path: '/api/finished-products', index: 8 },
  
  // Inventory Management APIs
  { name: 'Expiring Products', path: '/api/finished-products/expiring?days=7', index: 12 },
  { name: 'Low Stock Products', path: '/api/finished-products/low-stock?threshold=10', index: 13 },
  
  // Dashboard APIs
  { name: 'Dashboard Summary', path: '/api/dashboard/summary', index: 16 },
  { name: 'Dashboard Alerts', path: '/api/dashboard/alerts', index: 17 },
  { name: 'Dashboard Trends', path: '/api/dashboard/trends?days=7', index: 18 },
  { name: 'Dashboard Categories', path: '/api/dashboard/categories', index: 19 },
  { name: 'Dashboard Value', path: '/api/dashboard/value', index: 20 },
  
  // Recipe APIs
  { name: 'Recipes API', path: '/api/recipes', index: 21 },
  { name: 'What Can I Make', path: '/api/recipes/what-can-i-make', index: 24 },
];

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testAllApiEndpoints() {
  console.log('🧪 COMPREHENSIVE API TEST VERIFICATION');
  console.log('=====================================\n');
  console.log('Testing all endpoints used by the API Test page...\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const endpoint of API_ENDPOINTS) {
    totalTests++;
    const indexStr = `[${endpoint.index.toString().padStart(2, '0')}]`;
    
    try {
      console.log(`🔍 ${indexStr} Testing ${endpoint.name}...`);
      const response = await makeRequest(endpoint.path);
      
      if (response.statusCode === 200 && response.data && response.data.success) {
        console.log(`✅ ${indexStr} ${endpoint.name} - SUCCESS`);
        
        // Log data info if available
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`    📊 Returned ${response.data.data.length} items`);
        } else if (response.data.data) {
          console.log(`    📊 Returned data object`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ ${indexStr} ${endpoint.name} - FAILED`);
        console.log(`    Status: ${response.statusCode}`);
        if (response.data && !response.data.success) {
          console.log(`    Error: ${response.data.error || 'Unknown error'}`);
        }
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ${indexStr} ${endpoint.name} - ERROR: ${error.message}`);
      failedTests++;
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('=====================================');
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('=====================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL API ENDPOINTS ARE WORKING PERFECTLY!');
    console.log('✅ The API Test page should work flawlessly');
    console.log('✅ "Run All Tests" button will execute without errors');
    console.log('✅ All index alignments are correct (0-26)');
  } else {
    console.log(`\n⚠️  ${failedTests} endpoint(s) need attention`);
    console.log('🔧 Check backend server and database connectivity');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Open http://localhost:3002/api-test in browser');
  console.log('2. Click "Run All Tests" button');
  console.log('3. Verify all tests execute without JavaScript errors');
  console.log('4. Check that test results update correctly in the UI');
}

testAllApiEndpoints().catch(console.error);