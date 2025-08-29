const fetch = require('node-fetch');

async function testQualityStatusAPI() {
  try {
    console.log('Testing Quality Status API endpoint...');

    const response = await fetch('http://localhost:8000/api/quality-statuses');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ API Response successful:');

      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('Number of quality statuses:', responseData.data.length);
        if (responseData.data.length > 0) {
          console.log('First status:', JSON.stringify(responseData.data[0], null, 2));
          console.log('✅ TEST PASSED: Found quality statuses in API response');
          return true;
        } else {
          console.log('⚠️ No quality statuses found in the response');
          return false;
        }
      } else {
        console.log('❌ Invalid response format - expected data array');
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        return false;
      }
    } else {
      console.error('❌ API Response failed:', response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

testQualityStatusAPI()
  .then(success => {
    if (!success) {
      console.log('❌ Quality status API test failed');
      process.exit(1);
    } else {
      console.log('✅ Quality status API test completed successfully');
    }
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
