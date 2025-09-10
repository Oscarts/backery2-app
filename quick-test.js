const axios = require('axios');

async function quickTest() {
    try {
        // Get a recipe
        const recipesResponse = await axios.get('http://localhost:8000/api/recipes');
        const recipe = recipesResponse.data.data[0];

        // Create production with custom steps
        const productionData = {
            name: "Debug Test",
            recipeId: recipe.id,
            targetQuantity: 1,
            targetUnit: "kg",
            customSteps: [
                { name: "Debug Step", description: "Test", stepOrder: 1, estimatedMinutes: 10 }
            ]
        };

        console.log('Sending:', JSON.stringify(productionData, null, 2));

        const response = await axios.post('http://localhost:8000/api/production/runs', productionData);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

quickTest();
