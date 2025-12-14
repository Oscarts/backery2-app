const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testCustomSteps() {
    try {
        console.log('🔍 Testing custom steps functionality...\n');

        // Test server connectivity first
        try {
            await axios.get(`${BASE_URL}/recipes`);
            console.log('✅ Server is accessible\n');
        } catch (error) {
            console.log('❌ Cannot reach server at', BASE_URL);
            console.log('Error:', error.code || error.message);
            return;
        }

        // Get recipes first
        console.log('1. Getting available recipes...');
        const recipesResponse = await axios.get(`${BASE_URL}/recipes`);
        const recipes = recipesResponse.data.data;

        if (recipes.length === 0) {
            console.log('❌ No recipes available for testing');
            return;
        }

        const testRecipe = recipes[0];
        console.log(`✅ Using recipe: ${testRecipe.name} (ID: ${testRecipe.id})\n`);

        // Test 1: Create production run with custom steps
        console.log('2. Testing production run creation with custom steps...');
        const customSteps = [
            {
                name: 'Custom Prep Step',
                description: 'This is a custom preparation step',
                stepOrder: 1,
                estimatedMinutes: 25
            },
            {
                name: 'Custom Baking Step',
                description: 'This is a custom baking step',
                stepOrder: 2,
                estimatedMinutes: 40
            },
            {
                name: 'Custom Finishing Step',
                description: 'This is a custom finishing step',
                stepOrder: 3,
                estimatedMinutes: 15
            }
        ];

        const productionData = {
            name: `Test Custom Steps - ${testRecipe.name}`,
            recipeId: testRecipe.id,
            targetQuantity: testRecipe.yieldQuantity || 12,
            targetUnit: testRecipe.yieldUnit || 'pieces',
            notes: 'Testing custom steps functionality',
            customSteps: customSteps
        };

        console.log('📤 Sending request with data:');
        console.log(JSON.stringify(productionData, null, 2));

        const createResponse = await axios.post(`${BASE_URL}/production/runs`, productionData);

        if (createResponse.data.success) {
            console.log('✅ Production run created successfully!');
            const createdRun = createResponse.data.data;
            console.log(`   Production ID: ${createdRun.id}`);
            console.log(`   Created steps: ${createdRun.steps.length}`);

            console.log('\n📋 Created steps:');
            createdRun.steps.forEach(step => {
                console.log(`   ${step.stepOrder}. ${step.name} (${step.estimatedMinutes} min)`);
                console.log(`      Description: ${step.description}`);
            });

            // Verify custom steps were used
            const hasCustomSteps = createdRun.steps.some(step =>
                step.name.includes('Custom') ||
                customSteps.some(cs => cs.name === step.name)
            );

            if (hasCustomSteps) {
                console.log('\n🎉 SUCCESS: Custom steps were properly used!');
            } else {
                console.log('\n❌ FAILURE: Default steps were used instead of custom steps');
                console.log('Expected steps:', customSteps.map(s => s.name));
                console.log('Actual steps:', createdRun.steps.map(s => s.name));
            }
        } else {
            console.log('❌ Failed to create production run');
            console.log('Response:', createResponse.data);
        }

        // Test 2: Create production run without custom steps (should use defaults)
        console.log('\n3. Testing production run creation without custom steps...');
        const defaultProductionData = {
            name: `Test Default Steps - ${testRecipe.name}`,
            recipeId: testRecipe.id,
            targetQuantity: testRecipe.yieldQuantity || 12,
            targetUnit: testRecipe.yieldUnit || 'pieces',
            notes: 'Testing default steps functionality'
            // No customSteps property
        };

        const defaultResponse = await axios.post(`${BASE_URL}/production/runs`, defaultProductionData);

        if (defaultResponse.data.success) {
            console.log('✅ Production run with default steps created successfully!');
            const defaultRun = defaultResponse.data.data;
            console.log('\n📋 Default steps:');
            defaultRun.steps.forEach(step => {
                console.log(`   ${step.stepOrder}. ${step.name} (${step.estimatedMinutes} min)`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testCustomSteps();
