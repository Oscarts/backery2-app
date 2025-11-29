/**
 * Quick test to verify unit validation is working
 */

const axios = require('axios');

async function testRecipeCreation() {
    const API_BASE = 'http://localhost:8000/api';

    console.log('🧪 Testing Recipe Creation with Ingredient Units...\n');

    try {
        // First, get a valid auth token (you'll need to login)
        // For now, let's just test what units are valid

        const unitsResponse = await axios.get(`${API_BASE}/units`);
        const units = unitsResponse.data.data;

        console.log('✅ Available units in database:');
        console.log('   COUNT units:', units.filter(u => u.category === 'COUNT').map(u => u.symbol).join(', '));
        console.log('   WEIGHT units:', units.filter(u => u.category === 'WEIGHT').map(u => u.symbol).join(', '));
        console.log('   VOLUME units:', units.filter(u => u.category === 'VOLUME').map(u => u.symbol).join(', '));
        console.log('');

        // Test recipe payload with 'pc' unit
        console.log('📝 Test recipe data:');
        const testRecipe = {
            name: 'Test Recipe',
            yieldQuantity: 10,
            yieldUnit: 'pc',
            ingredients: [
                { unit: 'kg', quantity: 1, rawMaterialId: 'test-id' },
                { unit: 'pc', quantity: 5, rawMaterialId: 'test-id-2' }
            ]
        };
        console.log(JSON.stringify(testRecipe, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRecipeCreation();
