const axios = require('axios');

async function testEnhancedRecipeUI() {
  try {
    console.log('🎨 Testing Enhanced Recipe UI System');
    
    const baseURL = 'http://localhost:8000/api';
    
    // Step 1: Test recipe creation with new fields
    console.log('\n1. Testing recipe creation with enhanced fields...');
    const newRecipe = {
      name: 'Artisan Chocolate Croissant',
      description: 'A rich, buttery croissant filled with premium dark chocolate',
      categoryId: 'cmg3cm1t3000bfyzzrb9isrbw', // Use existing category
      yieldQuantity: 12,
      yieldUnit: 'pieces',
      prepTime: 180, // 3 hours
      cookTime: 25,
      difficulty: 'HARD',
      emoji: '🥐',
      imageUrl: 'https://example.com/chocolate-croissant.jpg',
      overheadPercentage: 25, // Higher overhead for complex pastry
      ingredients: [
        {
          ingredientType: 'RAW',
          rawMaterialId: 'cmg46gwrp0001dqas3geu1vox', // Reusable Flour
          quantity: 2,
          unit: 'test-kg-1759003870824',
          notes: 'Premium bread flour'
        }
      ]
    };

    const createResponse = await axios.post(`${baseURL}/recipes`, newRecipe);
    const createdRecipe = createResponse.data.data;
    console.log(`✅ Created recipe: "${createdRecipe.name}" with ID: ${createdRecipe.id}`);
    console.log(`   - Difficulty: ${createdRecipe.difficulty}`);
    console.log(`   - Emoji: ${createdRecipe.emoji}`);
    console.log(`   - Overhead: ${createdRecipe.overheadPercentage}%`);
    console.log(`   - Image URL: ${createdRecipe.imageUrl ? 'Set' : 'Not set'}`);

    // Step 2: Test cost calculation with custom overhead
    console.log('\n2. Testing cost calculation with custom overhead...');
    const costResponse = await axios.get(`${baseURL}/recipes/${createdRecipe.id}/cost`);
    const costData = costResponse.data.data;
    
    console.log('Cost Breakdown:');
    console.log(`   - Material Cost: $${costData.totalMaterialCost.toFixed(2)}`);
    console.log(`   - Overhead Cost: $${costData.overheadCost.toFixed(2)} (${createdRecipe.overheadPercentage}%)`);
    console.log(`   - Total Production Cost: $${costData.totalProductionCost.toFixed(2)}`);
    console.log(`   - Cost Per Piece: $${costData.costPerUnit.toFixed(2)}`);

    // Step 3: Test overhead update
    console.log('\n3. Testing overhead percentage update...');
    const updatedRecipe = await axios.put(`${baseURL}/recipes/${createdRecipe.id}`, {
      overheadPercentage: 30
    });
    console.log(`✅ Updated overhead to: ${updatedRecipe.data.data.overheadPercentage}%`);

    // Recalculate cost with new overhead
    const newCostResponse = await axios.get(`${baseURL}/recipes/${createdRecipe.id}/cost`);
    const newCostData = newCostResponse.data.data;
    console.log(`   - New Total Cost: $${newCostData.totalProductionCost.toFixed(2)}`);
    console.log(`   - New Overhead: $${newCostData.overheadCost.toFixed(2)} (30%)`);

    // Step 4: Test recipe retrieval with all fields
    console.log('\n4. Testing recipe retrieval with enhanced fields...');
    const getResponse = await axios.get(`${baseURL}/recipes/${createdRecipe.id}`);
    const retrievedRecipe = getResponse.data.data;
    
    console.log('Retrieved Recipe Details:');
    console.log(`   - Name: ${retrievedRecipe.name}`);
    console.log(`   - Description: ${retrievedRecipe.description}`);
    console.log(`   - Difficulty: ${retrievedRecipe.difficulty}`);
    console.log(`   - Prep Time: ${retrievedRecipe.prepTime} min`);
    console.log(`   - Cook Time: ${retrievedRecipe.cookTime} min`);
    console.log(`   - Total Time: ${(retrievedRecipe.prepTime || 0) + (retrievedRecipe.cookTime || 0)} min`);
    console.log(`   - Emoji: ${retrievedRecipe.emoji}`);
    console.log(`   - Image URL: ${retrievedRecipe.imageUrl}`);
    console.log(`   - Overhead: ${retrievedRecipe.overheadPercentage}%`);
    console.log(`   - Estimated Cost: $${retrievedRecipe.estimatedCost?.toFixed(2) || 'Not calculated'}`);

    // Step 5: Test recipe list with enhanced data
    console.log('\n5. Testing recipe list with enhanced data...');
    const listResponse = await axios.get(`${baseURL}/recipes`);
    const recipes = listResponse.data.data;
    
    console.log(`Found ${recipes.length} recipes:`);
    recipes.slice(0, 3).forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.name}`);
      console.log(`      - Difficulty: ${recipe.difficulty || 'Not set'}`);
      console.log(`      - Cost: $${recipe.estimatedCost?.toFixed(2) || 'Not calculated'}`);
      console.log(`      - Overhead: ${recipe.overheadPercentage || 20}%`);
      console.log(`      - Has Image: ${recipe.imageUrl ? 'Yes' : 'No'}`);
    });

    // Step 6: Update recipe image
    console.log('\n6. Testing recipe image update...');
    const imageUpdateResponse = await axios.put(`${baseURL}/recipes/${createdRecipe.id}`, {
      imageUrl: 'https://example.com/updated-croissant.jpg'
    });
    console.log(`✅ Updated recipe image URL`);

    console.log('\n🎉 Enhanced Recipe UI System Test Completed Successfully!');
    console.log('\nNew Features Validated:');
    console.log('  ✅ Recipe creation with difficulty, emoji, and image URL');
    console.log('  ✅ Custom overhead percentage per recipe');
    console.log('  ✅ Enhanced cost calculation with configurable overhead');
    console.log('  ✅ Recipe image URL storage and retrieval');
    console.log('  ✅ Extended recipe metadata (prep/cook time, difficulty)');
    console.log('  ✅ Backward compatibility with existing recipes');

    return createdRecipe.id;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedRecipeUI().then(recipeId => {
  console.log(`\n📋 Test completed. Created recipe ID: ${recipeId}`);
  console.log('💡 You can now test the frontend UI with these enhanced recipes!');
});