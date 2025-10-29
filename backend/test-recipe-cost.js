const axios = require('axios');

async function testRecipeCost() {
  try {
    console.log('🧪 Testing Recipe Cost Calculation API');
    
    const baseURL = 'http://localhost:8000/api';
    
    // First, get a list of recipes to test with
    console.log('\n1. Fetching available recipes...');
    const recipesResponse = await axios.get(`${baseURL}/recipes`);
    const recipes = recipesResponse.data.data || recipesResponse.data;
    
    if (!recipes || recipes.length === 0) {
      console.log('❌ No recipes found to test with');
      return;
    }
    
    const testRecipe = recipes[0];
    console.log(`✅ Found recipe to test: "${testRecipe.name}" (ID: ${testRecipe.id})`);
    
    // Test getting recipe cost
    console.log('\n2. Testing GET /api/recipes/:id/cost...');
    const costResponse = await axios.get(`${baseURL}/recipes/${testRecipe.id}/cost`);
    console.log('✅ Cost calculation response:', JSON.stringify(costResponse.data, null, 2));
    
    // Test updating recipe cost
    console.log('\n3. Testing PUT /api/recipes/:id/cost...');
    const updateResponse = await axios.put(`${baseURL}/recipes/${testRecipe.id}/cost`);
    console.log('✅ Cost update response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Test batch update (small sample)
    console.log('\n4. Testing PUT /api/recipes/costs/update-all...');
    const batchResponse = await axios.put(`${baseURL}/recipes/costs/update-all`);
    console.log('✅ Batch update response:', JSON.stringify(batchResponse.data, null, 2));
    
    console.log('\n🎉 All recipe cost tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testRecipeCost();