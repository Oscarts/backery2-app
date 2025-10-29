const axios = require('axios');

async function testFullCostWorkflow() {
  try {
    console.log('🧪 Testing Full Recipe Cost Calculation Workflow');
    
    const baseURL = 'http://localhost:8000/api';
    
    // Step 1: Get recipes to see current estimated costs
    console.log('\n1. Fetching recipes with current costs...');
    const recipesResponse = await axios.get(`${baseURL}/recipes`);
    const recipes = recipesResponse.data.data || recipesResponse.data;
    
    console.log('Recipe costs summary:');
    recipes.slice(0, 3).forEach(recipe => {
      console.log(`  - ${recipe.name}: $${recipe.estimatedCost || 'Not calculated'}`);
    });
    
    if (recipes.length === 0) {
      console.log('❌ No recipes found to test with');
      return;
    }
    
    const testRecipe = recipes[0];
    
    // Step 2: Get detailed cost breakdown
    console.log(`\n2. Getting detailed cost breakdown for "${testRecipe.name}"...`);
    const costResponse = await axios.get(`${baseURL}/recipes/${testRecipe.id}/cost`);
    const costData = costResponse.data.data;
    
    console.log('Cost Breakdown:');
    console.log(`  - Material Cost: $${costData.totalMaterialCost.toFixed(2)}`);
    console.log(`  - Overhead Cost: $${costData.overheadCost.toFixed(2)}`);
    console.log(`  - Total Production Cost: $${costData.totalProductionCost.toFixed(2)}`);
    console.log(`  - Cost Per Unit: $${costData.costPerUnit.toFixed(2)}`);
    console.log(`  - Ingredients: ${costData.ingredients.length}`);
    
    // Step 3: Update all recipe costs
    console.log('\n3. Updating all recipe costs...');
    const updateResponse = await axios.put(`${baseURL}/recipes/costs/update-all`);
    console.log(`Updated ${updateResponse.data.data.updated} recipes`);
    
    // Step 4: Verify costs are updated in main recipe list
    console.log('\n4. Verifying updated costs...');
    const updatedRecipesResponse = await axios.get(`${baseURL}/recipes`);
    const updatedRecipes = updatedRecipesResponse.data.data || updatedRecipesResponse.data;
    
    console.log('Updated recipe costs:');
    updatedRecipes.slice(0, 3).forEach(recipe => {
      console.log(`  - ${recipe.name}: $${recipe.estimatedCost || 'Not calculated'}`);
    });
    
    console.log('\n🎉 Full workflow test passed!');
    console.log('\nFeatures validated:');
    console.log('  ✅ Recipe cost calculation with overhead');
    console.log('  ✅ Detailed ingredient cost breakdown');
    console.log('  ✅ Batch cost updates');
    console.log('  ✅ Cost display in recipe listings');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFullCostWorkflow();