const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testRecipeAPI() {
    try {
        console.log('🧪 Starting Recipe API Tests...\n');

        // Test 1: Get all recipes
        console.log('Test 1: Get all recipes');
        try {
            const recipesResponse = await axios.get(`${API_URL}/api/recipes`);
            console.log('✅ Successfully fetched recipes:', recipesResponse.data.data.length, 'found\n');
        } catch (error) {
            console.error('Error in Test 1:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
            throw error;
        }

        // Test 2: Create recipe without categoryId
        console.log('Test 2: Create recipe without categoryId');
        let createdRecipe;
        try {
            const newRecipe = {
                name: `Test Recipe ${Date.now()}`,
                description: 'Test recipe created without categoryId',
                yieldQuantity: 1,
                yieldUnit: 'kg',
                prepTime: 30,
                cookTime: 20,
                instructions: ['Mix ingredients', 'Bake until golden'],
                ingredients: []
            };

            const createResponse = await axios.post(`${API_URL}/api/recipes`, newRecipe);
            createdRecipe = createResponse.data.data;
            console.log('✅ Successfully created recipe without categoryId:', createdRecipe.id, '\n');
        } catch (error) {
            console.error('Error in Test 2:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
            throw error;
        }

        // Test 3: Get recipe by ID
        console.log('Test 3: Get recipe by ID');
        try {
            const getByIdResponse = await axios.get(`${API_URL}/api/recipes/${createdRecipe.id}`);
            console.log('✅ Successfully fetched recipe by ID\n');
        } catch (error) {
            console.error('Error in Test 3:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
            throw error;
        }

        // Test 4: Update recipe
        console.log('Test 4: Update recipe');
        try {
            const updateData = {
                name: `Updated Recipe ${Date.now()}`,
                description: 'Updated test recipe description',
                prepTime: 45
            };

            const updateResponse = await axios.put(`${API_URL}/api/recipes/${createdRecipe.id}`, updateData);
            console.log('✅ Successfully updated recipe\n');
        } catch (error) {
            console.error('Error in Test 4:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
            throw error;
        }

        // Test 5: Delete recipe
        console.log('Test 5: Delete recipe');
        try {
            const deleteResponse = await axios.delete(`${API_URL}/api/recipes/${createdRecipe.id}`);
            console.log('✅ Successfully deleted recipe\n');
        } catch (error) {
            console.error('Error in Test 5:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
            throw error;
        }

        console.log('🎉 All recipe API tests passed!');
    } catch (error) {
        console.error('❌ Test failed');
        process.exit(1);
    }
}

// Add error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

testRecipeAPI();
