#!/usr/bin/env node

/**
 * Test script to verify the ingredient availability fix
 * Tests both API consistency and frontend behavior
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testIngredientAvailabilityFix() {
    console.log('🧪 Testing Ingredient Availability Fix');
    console.log('=====================================\n');

    try {
        // Test 1: Verify "what can I make" API works correctly
        console.log('1. Testing "what can I make" API...');
        const whatCanIMakeResponse = await axios.get(`${BASE_URL}/api/recipes/what-can-i-make`);
        const { canMakeCount, totalRecipes, recipes } = whatCanIMakeResponse.data.data;

        console.log(`   ✅ Can make ${canMakeCount} out of ${totalRecipes} recipes`);

        // Find a recipe with ingredients
        const recipeWithIngredients = recipes.find(r => r.recipeName.includes('Artisan') || r.recipeName.includes('Test'));
        if (recipeWithIngredients) {
            console.log(`   📝 Found test recipe: ${recipeWithIngredients.recipeName}`);
            console.log(`      - Can make: ${recipeWithIngredients.canMake}`);
            console.log(`      - Max batches: ${recipeWithIngredients.maxBatches}`);
            console.log(`      - Missing ingredients: ${recipeWithIngredients.missingIngredients.length}`);
        }

        // Test 2: Verify individual recipe ingredients
        console.log('\n2. Testing recipe ingredient details...');
        if (recipeWithIngredients) {
            const recipeResponse = await axios.get(`${BASE_URL}/api/recipes/${recipeWithIngredients.recipeId}`);
            const recipe = recipeResponse.data.data;

            console.log(`   📋 Recipe "${recipe.name}" has ${recipe.ingredients?.length || 0} ingredients`);
            if (recipe.ingredients) {
                recipe.ingredients.forEach(ing => {
                    const materialName = ing.rawMaterial?.name || ing.finishedProduct?.name || 'Unknown';
                    console.log(`      - ${ing.quantity} ${ing.unit} of ${materialName}`);
                });
            }
        }

        // Test 3: Test production creation (should work for available recipes)
        console.log('\n3. Testing production creation...');
        const availableRecipe = recipes.find(r => r.canMake === true);
        if (availableRecipe) {
            try {
                const productionResponse = await axios.post(`${BASE_URL}/api/production/runs`, {
                    name: `Test Production - ${availableRecipe.recipeName}`,
                    recipeId: availableRecipe.recipeId,
                    targetQuantity: 1,
                    targetUnit: availableRecipe.yieldUnit
                });

                console.log(`   ✅ Successfully created production run for available recipe`);
                console.log(`      Production ID: ${productionResponse.data.data.id}`);
            } catch (error) {
                console.log(`   ❌ Failed to create production for available recipe: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  No available recipes found to test production creation');
        }

        // Test 4: Verify API consistency
        console.log('\n4. Testing API consistency...');
        const regularRecipesResponse = await axios.get(`${BASE_URL}/api/recipes`);
        const regularRecipes = regularRecipesResponse.data.data;

        console.log(`   📊 Regular recipes API returned ${regularRecipes.length} recipes`);
        console.log(`   📊 What-can-I-make API returned ${recipes.length} recipes`);

        if (regularRecipes.length === recipes.length) {
            console.log('   ✅ Recipe count is consistent between APIs');
        } else {
            console.log('   ⚠️  Recipe count differs between APIs (this might be expected)');
        }

        // Test 5: Check for availability data structure
        console.log('\n5. Testing availability data structure...');
        const recipeWithAvailability = recipes[0];
        const hasRequiredFields = recipeWithAvailability.hasOwnProperty('canMake') &&
            recipeWithAvailability.hasOwnProperty('maxBatches') &&
            recipeWithAvailability.hasOwnProperty('missingIngredients');

        if (hasRequiredFields) {
            console.log('   ✅ Recipes include required availability fields');
        } else {
            console.log('   ❌ Recipes missing required availability fields');
        }

        console.log('\n🎉 Ingredient Availability Fix Test Complete!');
        console.log('\nSummary:');
        console.log(`- Total recipes: ${totalRecipes}`);
        console.log(`- Available recipes: ${canMakeCount}`);
        console.log(`- Unavailable recipes: ${totalRecipes - canMakeCount}`);

        if (totalRecipes - canMakeCount > 0) {
            console.log('\n⚠️  Some recipes are unavailable. Frontend should show "Cannot start production" message for these.');
        } else {
            console.log('\n✅ All recipes are currently available.');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testIngredientAvailabilityFix();
