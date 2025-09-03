const axios = require('axios');

// Test configuration
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    validateStatus: null
});

// Test the recipe operations
async function testRecipeOperations() {
    console.log('🧪 Testing recipe operations...\n');

    try {
        // Step 1: Create a test recipe without categoryId
        console.log('Creating test recipe...');

        const createRes = await api.post('/recipes', {
            name: 'Test Recipe - No Category',
            description: 'A test recipe without category',
            yieldQuantity: 1,
            yieldUnit: 'kg',
            prepTime: 30,
            cookTime: 20,
            instructions: ['Mix ingredients', 'Bake until golden'],
            ingredients: []
        });

        if (!createRes.data.success) {
            throw new Error(`Failed to create recipe: ${createRes.data.error}`);
        }

        const recipeId = createRes.data.data.id;
        console.log(`✅ Created recipe with ID: ${recipeId}`);

        // Step 2: Verify the recipe was created without categoryId
        console.log('\nVerifying recipe...');
        const getRes = await api.get(`/recipes/${recipeId}`);

        if (!getRes.data.success) {
            throw new Error(`Failed to get recipe: ${getRes.data.error}`);
        }

        const recipe = getRes.data.data;
        console.assert(
            recipe.name === 'Test Recipe - No Category' &&
            recipe.categoryId === null,
            '❌ Recipe verification failed'
        );
        console.log('✅ Recipe verified successfully');

        // Step 3: Update the recipe
        console.log('\nUpdating recipe...');
        const updateRes = await api.put(`/recipes/${recipeId}`, {
            name: 'Updated Test Recipe',
            description: 'Updated description'
        });

        if (!updateRes.data.success) {
            throw new Error(`Failed to update recipe: ${updateRes.data.error}`);
        }
        console.log('✅ Recipe updated successfully');

        // Step 4: Delete the recipe
        console.log('\nDeleting recipe...');
        const deleteRes = await api.delete(`/recipes/${recipeId}`);

        if (!deleteRes.data.success) {
            throw new Error(`Failed to delete recipe: ${deleteRes.data.error}`);
        }
        console.log('✅ Recipe deleted successfully');

        console.log('\n✅ All recipe operations tests passed!');
    } catch (error) {
        console.error('❌ Error during recipe operations test:', error);
        console.error('Response data:', error.response?.data);
        process.exit(1);
    }
}

// Run the test
testRecipeOperations()
    .then(() => {
        console.log('✅ Recipe test completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Unexpected error in test:', err);
        process.exit(1);
    });
