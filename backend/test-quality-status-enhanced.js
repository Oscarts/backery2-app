/**
 * Enhanced API test script that checks server health before running tests
 */
const fetch = require('node-fetch');

// Check if server is running and healthy before proceeding with tests
async function checkServerHealth() {
  try {
    console.log('🔍 Checking if server is running...');
    const response = await fetch('http://localhost:8000/health', { 
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      console.error('⚠️ Server is running but health check failed');
      console.error('Status:', response.status);
      return false;
    }
    
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.error('⚠️ Server not running or not accessible');
    console.error('Make sure to start the backend server with: npm run dev');
    console.error('Error:', error.message);
    return false;
  }
}

// Test quality status API with improved error handling
async function testQualityStatusAPI() {
  try {
    console.log('\n🧪 Testing Quality Status API...');
    
    // First check if server is healthy
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.error('❌ Cannot test Quality Status API without a running server');
      return false;
    }
    
    const response = await fetch('http://localhost:8000/api/quality-statuses', {
      timeout: 5000 // 5 second timeout
    });

    if (!response.ok) {
      console.error(`❌ API Response failed with status ${response.status}: ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
      return false;
    }

    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('❌ Invalid API response format');
      console.error('Received:', JSON.stringify(data, null, 2));
      return false;
    }
    
    console.log(`✅ Successfully retrieved ${data.data.length} quality statuses`);
    
    if (data.data.length > 0) {
      console.log('First status:', JSON.stringify(data.data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the tests
(async () => {
  try {
    const qualityTestPassed = await testQualityStatusAPI();
    
    if (qualityTestPassed) {
      console.log('\n✅ Quality Status API test passed successfully!');
    } else {
      console.log('\n❌ Quality Status API test failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
})();
