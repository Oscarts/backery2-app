const fetch = require('node-fetch');
const assert = require('assert').strict;
const chalk = require('chalk');

/**
 * Tests for the What Can I Make API endpoint
 * This test checks that the endpoint returns data in the correct format expected by the frontend
 */
async function runTests() {
    console.log(chalk.blue('🧪 Testing What Can I Make API...'));

    try {
        // Test the what-can-i-make endpoint
        const response = await fetch('http://localhost:8000/api/recipes/what-can-i-make');
        const data = await response.json();

        // Check HTTP response
        assert.equal(response.ok, true, 'HTTP response should be successful');
        assert.equal(response.status, 200, 'HTTP status code should be 200');

        // Check base response structure
        assert.equal(data.success, true, 'Response should have success=true');
        assert.ok(data.data, 'Response should have a data object');

        // Check data fields
        const analysis = data.data;
        assert.ok(typeof analysis.totalRecipes === 'number', 'totalRecipes should be a number');
        assert.ok(typeof analysis.canMakeCount === 'number', 'canMakeCount should be a number');
        assert.ok(Array.isArray(analysis.recipes), 'recipes should be an array');

        if (analysis.recipes.length > 0) {
            const recipe = analysis.recipes[0];

            // Check recipe structure
            assert.ok(recipe.recipeId, 'Recipe should have recipeId');
            assert.ok(recipe.recipeName, 'Recipe should have recipeName');
            assert.ok('category' in recipe, 'Recipe should have category field');
            assert.ok('canMake' in recipe, 'Recipe should have canMake field');
            assert.ok('maxBatches' in recipe, 'Recipe should have maxBatches field');
            assert.ok(Array.isArray(recipe.missingIngredients), 'missingIngredients should be an array');

            // If there are missing ingredients, check their structure
            if (recipe.missingIngredients.length > 0) {
                const ingredient = recipe.missingIngredients[0];
                assert.ok(ingredient.name, 'Missing ingredient should have a name');
                assert.ok('needed' in ingredient, 'Missing ingredient should have needed field');
                assert.ok('available' in ingredient, 'Missing ingredient should have available field');
                assert.ok('shortage' in ingredient, 'Missing ingredient should have shortage field');
            }
        }

        console.log(chalk.green('✅ What Can I Make API test passed!'));
    } catch (error) {
        console.error(chalk.red('❌ What Can I Make API test failed!'));
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

// Run the tests
runTests();
