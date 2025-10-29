const axios = require('axios');

async function testUnitsForRecipe() {
  try {
    console.log('Testing units data for recipe form...');
    
    // Test units endpoint - this is what the recipe form uses
    const unitsResponse = await axios.get('http://localhost:8000/api/units');
    console.log(`✓ Found ${unitsResponse.data.data.length} units from API`);
    
    // Show first 5 units to see the structure
    console.log('\nFirst 5 units structure:');
    unitsResponse.data.data.slice(0, 5).forEach(unit => {
      console.log(`  - ${unit.name} (${unit.symbol}) [${unit.category}]`);
      console.log(`    Fields: id=${unit.id}, isActive=${unit.isActive}`);
    });
    
    // Check if all required fields are present
    const allUnitsValid = unitsResponse.data.data.every(unit => 
      unit.id && unit.name && unit.symbol && unit.category
    );
    
    console.log(`\n✓ All units have required fields: ${allUnitsValid}`);
    
  } catch (error) {
    console.error('❌ Error testing units for recipe:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUnitsForRecipe();