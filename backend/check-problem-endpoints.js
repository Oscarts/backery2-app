const axios = require('axios');

async function checkProblemEndpoints() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Checking problem endpoints...\n');
  
  // Check Storage Locations
  try {
    console.log('Testing Storage Locations...');
    const response = await axios.get(`${baseURL}/storageLocations`);
    console.log('✅ Storage Locations:', response.data);
  } catch (error) {
    console.log('❌ Storage Locations error:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
  
  console.log('\n');
  
  // Check Quality Statuses
  try {
    console.log('Testing Quality Statuses...');
    const response = await axios.get(`${baseURL}/qualityStatuses`);
    console.log('✅ Quality Statuses:', response.data);
  } catch (error) {
    console.log('❌ Quality Statuses error:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

checkProblemEndpoints();