const axios = require('axios');

async function debugUnitsIssue() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Debugging Units Issue...\n');
  
  try {
    console.log('1. Attempting to create test unit...');
    const response = await axios.post(`${baseURL}/units`, {
      name: 'Test Unit CRUD',
      symbol: 'tuc',
      category: 'WEIGHT',
      description: 'Test unit for CRUD testing'
    });
    console.log('✅ Created unit:', response.data);
  } catch (error) {
    console.log('❌ Create unit failed');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error:', error.message);
  }
  
  // Check if 'WEIGHT' is a valid category
  console.log('\n2. Checking existing units for valid categories...');
  try {
    const unitsResponse = await axios.get(`${baseURL}/units`);
    const units = unitsResponse.data.data || [];
    console.log('Existing units and their categories:');
    units.slice(0, 5).forEach(unit => {
      console.log(`  - ${unit.name} (${unit.symbol}): ${unit.category}`);
    });
    
    const uniqueCategories = [...new Set(units.map(u => u.category))];
    console.log('\nUnique categories found:', uniqueCategories);
  } catch (error) {
    console.log('❌ Failed to get units:', error.message);
  }
}

debugUnitsIssue();