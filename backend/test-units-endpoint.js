const axios = require('axios');

async function testUnitsEndpoint() {
  try {
    console.log('Testing GET /api/units...');
    const response = await axios.get('http://localhost:8000/api/units');
    console.log('✓ Units endpoint works');
    console.log(`Found ${response.data.data.length} units`);
    
    const unitsByCategory = response.data.data.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(unit);
      return acc;
    }, {});
    
    console.log('\nUnits by category:');
    Object.entries(unitsByCategory).forEach(([category, units]) => {
      console.log(`\n${category}:`);
      units.forEach(unit => {
        console.log(`  - ${unit.name} (${unit.symbol})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error testing units endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUnitsEndpoint();