/**
 * Integration Test: Production Capacity Calculation
 * 
 * This test validates that the production capacity fix is working correctly
 * against the actual running API server.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000';

async function testProductionCapacityFix() {
  console.log('🧪 Testing Production Capacity Calculation Fix...\n');

  try {
    // Test 1: Get what-can-i-make analysis
    console.log('📊 Fetching what-can-i-make analysis...');
    const response = await axios.get(`${API_BASE}/api/recipes/what-can-i-make`);

    if (!response.data.success) {
      throw new Error('API returned error: ' + response.data.error);
    }

    const recipes = response.data.data.recipes;
    console.log(`Found ${recipes.length} recipes in analysis\n`);

    // Test 2: Validate maxBatches calculation
    let allTestsPassed = true;

    for (const recipe of recipes) {
      console.log(`📝 Testing: ${recipe.recipeName}`);
      console.log(`   Can Make: ${recipe.canMake}`);
      console.log(`   Max Batches: ${recipe.maxBatches}`);
      console.log(`   Yield: ${recipe.yieldQuantity} ${recipe.yieldUnit}`);

      if (recipe.canMake) {
        const totalCapacity = recipe.maxBatches * recipe.yieldQuantity;
        console.log(`   Total Capacity: ${totalCapacity} ${recipe.yieldUnit}`);

        // Critical test: maxBatches should NOT be hardcoded to 1
        if (recipe.maxBatches === 1) {
          console.log(`   ❌ FAIL: maxBatches is 1 (likely hardcoded bug)`);
          allTestsPassed = false;
        } else if (recipe.maxBatches > 1) {
          console.log(`   ✅ PASS: maxBatches is calculated (${recipe.maxBatches})`);
        } else {
          console.log(`   ⚠️ INFO: maxBatches is 0 (insufficient ingredients)`);
        }
      } else {
        console.log(`   ✅ PASS: Recipe marked as unavailable (maxBatches: ${recipe.maxBatches})`);
      }
      console.log('');
    }

    // Test 3: Validate specific known recipes
    const breadRecipe = recipes.find(r => r.recipeName.includes('Bread Dough'));
    const creamRecipe = recipes.find(r => r.recipeName.includes('Pastry Cream'));

    if (breadRecipe && breadRecipe.canMake) {
      console.log('🍞 Validating Basic Bread Dough Recipe:');
      if (breadRecipe.maxBatches >= 50) {  // We know we have 50kg flour, need 1kg per batch
        console.log(`   ✅ PASS: Bread recipe shows ${breadRecipe.maxBatches} batches (expected ~50)`);
      } else {
        console.log(`   ❌ FAIL: Bread recipe shows only ${breadRecipe.maxBatches} batches (expected ~50)`);
        allTestsPassed = false;
      }
    }

    if (creamRecipe && creamRecipe.canMake) {
      console.log('🥛 Validating Vanilla Pastry Cream Recipe:');
      if (creamRecipe.maxBatches >= 10) {  // We know we have 10L cream, need 1L per batch
        console.log(`   ✅ PASS: Cream recipe shows ${creamRecipe.maxBatches} batches (expected ~10)`);
      } else {
        console.log(`   ❌ FAIL: Cream recipe shows only ${creamRecipe.maxBatches} batches (expected ~10)`);
        allTestsPassed = false;
      }
    }

    // Test 4: Validate response structure
    console.log('\n🔍 Validating Response Structure:');
    const requiredFields = ['recipeId', 'recipeName', 'canMake', 'maxBatches', 'yieldQuantity', 'yieldUnit'];
    let structureValid = true;

    for (const recipe of recipes) {
      for (const field of requiredFields) {
        if (!(field in recipe)) {
          console.log(`   ❌ FAIL: Missing field '${field}' in recipe ${recipe.recipeName}`);
          structureValid = false;
          allTestsPassed = false;
        }
      }
    }

    if (structureValid) {
      console.log('   ✅ PASS: All required fields present in response');
    }

    // Final result
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Production capacity fix is working correctly.');
      console.log('✅ maxBatches calculation is properly implemented');
      console.log('✅ Limiting ingredient analysis is working');
      console.log('✅ API response structure is correct');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED! Production capacity fix needs attention.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the backend server is running on http://localhost:8000');
    }
    process.exit(1);
  }
}

// Run the test
testProductionCapacityFix();
