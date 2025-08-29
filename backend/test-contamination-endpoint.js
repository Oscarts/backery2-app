/**
 * Test for the Contamination API endpoint
 */
const fetch = require('node-fetch');

async function testContaminationApiEndpoint() {
  try {
    console.log('🧪 Testing Contamination API endpoints...');

    // Test 1: Check if the status endpoint returns correct data
    console.log('\nTesting GET /api/contamination/status...');
    const response = await fetch('http://localhost:8000/api/contamination/status');

    if (response.ok) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Data:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        console.log('✅ Contamination status API returned valid data');
        console.log(`Raw Materials with contamination: ${data.data.rawMaterials}`);
        console.log(`Intermediate Products with contamination: ${data.data.intermediateProducts}`);
        console.log(`Finished Products with contamination: ${data.data.finishedProducts}`);
        console.log(`Total contaminated items: ${data.data.total}`);

        // If we got here, the test passed
        console.log('✅ Contamination API test passed!');
        return true;
      } else {
        console.error('❌ Contamination status API returned invalid data format');
        console.error('Received:', data);
        return false;
      }
    } else {
      console.error(`❌ API request failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing contamination API endpoint:', error);
    return false;
  }
}

testContaminationApiEndpoint()
  .then(success => {
    if (!success) {
      console.log('❌ Contamination API endpoint test failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
