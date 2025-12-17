const axios = require('axios');

async function debugCategoryIssues() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Debugging Category Issues...\n');
  
  try {
    // First create a test category
    console.log('1. Creating test category...');
    const createResponse = await axios.post(`${baseURL}/categories`, {
      name: 'Debug Test Category',
      type: 'RAW_MATERIAL',
      description: 'Debug test'
    });
    console.log('✅ Created category:', createResponse.data);
    const categoryId = createResponse.data.data.id;
    
    // Try to create duplicate
    console.log('\n2. Attempting to create duplicate category...');
    try {
      const duplicateResponse = await axios.post(`${baseURL}/categories`, {
        name: 'Debug Test Category',
        type: 'RAW_MATERIAL',
        description: 'Duplicate test'
      });
      console.log('❌ Unexpected success:', duplicateResponse.data);
    } catch (error) {
      console.log('Response status:', error.response?.status);
      console.log('Response data:', error.response?.data);
      console.log('Error message:', error.message);
    }
    
    // Try to update
    console.log('\n3. Attempting to update category...');
    try {
      const updateResponse = await axios.put(`${baseURL}/categories/${categoryId}`, {
        name: 'Updated Debug Test Category',
        description: 'Updated description'
      });
      console.log('✅ Updated category:', updateResponse.data);
    } catch (error) {
      console.log('Update error status:', error.response?.status);
      console.log('Update error data:', error.response?.data);
      console.log('Update error message:', error.message);
    }
    
    // Clean up
    console.log('\n4. Cleaning up...');
    try {
      await axios.delete(`${baseURL}/categories/${categoryId}`);
      console.log('✅ Cleaned up test category');
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
    
  } catch (error) {
    console.error('Debug error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

debugCategoryIssues();