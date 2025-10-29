// Test script to verify recipe units are working
const axios = require('axios');

async function testRecipeUnits() {
  try {
    console.log('🧪 Testing Recipe Units Integration...\n');
    
    // 1. Test units API endpoint
    console.log('1. Fetching units from API...');
    const unitsResponse = await axios.get('http://localhost:8000/api/units');
    const units = unitsResponse.data.data;
    
    console.log(`✅ Found ${units.length} units from API`);
    console.log('Units by category:');
    
    const unitsByCategory = units.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(unit);
      return acc;
    }, {});
    
    Object.entries(unitsByCategory).forEach(([category, categoryUnits]) => {
      console.log(`  ${category}: ${categoryUnits.map(u => `${u.name} (${u.symbol})`).join(', ')}`);
    });
    
    // 2. Test recipes API to see current recipe data
    console.log('\n2. Checking existing recipes...');
    const recipesResponse = await axios.get('http://localhost:8000/api/recipes');
    const recipes = recipesResponse.data.data;
    
    console.log(`✅ Found ${recipes.length} recipes`);
    
    if (recipes.length > 0) {
      const sampleRecipe = recipes[0];
      console.log(`\nSample recipe: "${sampleRecipe.name}"`);
      console.log(`  - Yield Unit: "${sampleRecipe.yieldUnit || 'Not set'}"`);
      console.log(`  - Ingredients: ${sampleRecipe.ingredients?.length || 0}`);
      
      if (sampleRecipe.ingredients && sampleRecipe.ingredients.length > 0) {
        console.log('  - Ingredient units:');
        sampleRecipe.ingredients.forEach((ing, i) => {
          const ingredientName = ing.rawMaterial?.name || ing.finishedProduct?.name || 'Unknown';
          console.log(`    ${i + 1}. ${ingredientName}: ${ing.quantity} ${ing.unit || 'No unit'}`);
        });
      }
      
      // Check if recipe units match available units
      const availableUnitNames = units.map(u => u.name);
      const availableUnitSymbols = units.map(u => u.symbol);
      
      console.log('\n3. Validating recipe unit consistency...');
      
      if (sampleRecipe.yieldUnit) {
        const yieldUnitValid = availableUnitNames.includes(sampleRecipe.yieldUnit) || 
                              availableUnitSymbols.includes(sampleRecipe.yieldUnit);
        console.log(`  - Yield unit "${sampleRecipe.yieldUnit}": ${yieldUnitValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      
      if (sampleRecipe.ingredients) {
        sampleRecipe.ingredients.forEach((ing, i) => {
          if (ing.unit) {
            const unitValid = availableUnitNames.includes(ing.unit) || 
                             availableUnitSymbols.includes(ing.unit);
            const ingredientName = ing.rawMaterial?.name || ing.finishedProduct?.name || 'Unknown';
            console.log(`  - Ingredient "${ingredientName}" unit "${ing.unit}": ${unitValid ? '✅ Valid' : '❌ Invalid'}`);
          }
        });
      }
    }
    
    console.log('\n✅ Recipe units test completed!');
    
  } catch (error) {
    console.error('❌ Error testing recipe units:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRecipeUnits();