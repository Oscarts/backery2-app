const axios = require('axios');

async function checkQualityStatusResponse() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Testing Quality Status Response Structure...\n');
  
  try {
    console.log('1. Attempting to create quality status...');
    const response = await axios.post(`${baseURL}/quality-statuses`, {
      name: 'Test Quality Response',
      description: 'Test quality status response',
      color: '#FF0000'
    });
    
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.id) {
      const testId = response.data.data.id;
      console.log('✅ Quality status created with ID:', testId);
      
      // Clean up
      await axios.delete(`${baseURL}/quality-statuses/${testId}`);
      console.log('✅ Cleaned up test quality status');
    }
    
  } catch (error) {
    console.log('❌ Create quality status failed');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

checkQualityStatusResponse();