const axios = require('axios');

async function finalUnitsTest() {
  try {
    console.log('🎯 Final Recipe Units Integration Test\n');
    
    // 1. Get all available units
    const unitsResponse = await axios.get('http://localhost:8000/api/units');
    const availableUnits = unitsResponse.data.data;
    
    console.log(`✅ Available units: ${availableUnits.length}`);
    const unitNames = availableUnits.map(u => u.name);
    const unitSymbols = availableUnits.map(u => u.symbol);
    
    // 2. Check recipe data consistency
    const recipesResponse = await axios.get('http://localhost:8000/api/recipes');
    const recipes = recipesResponse.data.data;
    
    console.log(`✅ Recipes to check: ${recipes.length}\n`);
    
    let validRecipes = 0;
    let invalidRecipes = [];
    
    recipes.forEach(recipe => {
      let isValid = true;
      let issues = [];
      
      // Check yield unit
      if (recipe.yieldUnit) {
        if (!unitNames.includes(recipe.yieldUnit) && !unitSymbols.includes(recipe.yieldUnit)) {
          isValid = false;
          issues.push(`Invalid yield unit: "${recipe.yieldUnit}"`);
        }
      }
      
      // Check ingredient units
      if (recipe.ingredients) {
        recipe.ingredients.forEach((ing, idx) => {
          if (ing.unit) {
            if (!unitNames.includes(ing.unit) && !unitSymbols.includes(ing.unit)) {
              isValid = false;
              issues.push(`Invalid ingredient ${idx + 1} unit: "${ing.unit}"`);
            }
          }
        });
      }
      
      if (isValid) {
        validRecipes++;
        console.log(`✅ "${recipe.name}": All units valid`);
      } else {
        invalidRecipes.push({ name: recipe.name, issues });
        console.log(`❌ "${recipe.name}": ${issues.join(', ')}`);
      }
    });
    
    console.log(`\n📊 Results:`);
    console.log(`  Valid recipes: ${validRecipes}/${recipes.length}`);
    console.log(`  Invalid recipes: ${invalidRecipes.length}/${recipes.length}`);
    
    if (invalidRecipes.length === 0) {
      console.log('\n🎉 SUCCESS: All recipes now use standardized units!');
      console.log('Both yield unit and ingredient unit dropdowns should show the same list.');
    } else {
      console.log('\n⚠️  Some recipes still have invalid units:');
      invalidRecipes.forEach(recipe => {
        console.log(`  - ${recipe.name}: ${recipe.issues.join(', ')}`);
      });
    }
    
    // 3. Show sample of what units should be available in dropdowns
    console.log('\n📋 Units available for dropdowns:');
    const categorized = availableUnits.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(`${unit.name} (${unit.symbol})`);
      return acc;
    }, {});
    
    Object.entries(categorized).forEach(([category, units]) => {
      console.log(`  ${category}: ${units.slice(0, 3).join(', ')}${units.length > 3 ? ` and ${units.length - 3} more` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

finalUnitsTest();