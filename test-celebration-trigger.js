// Test script to create a production and complete the last step to test celebration
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testCelebration() {
    try {
        console.log('🧪 Creating test production for celebration...');

        // Create a new production
        const productionResponse = await axios.post(`${BASE_URL}/production/runs`, {
            name: 'Test Celebration Production',
            recipeId: 'cmfbm3irr00017bqelkoydhai',
            targetQuantity: 1,
            targetUnit: 'kg',
            priority: 'MEDIUM',
            notes: 'Test production for celebration'
        });

        if (!productionResponse.data.success) {
            throw new Error('Failed to create production');
        }

        const production = productionResponse.data.data;
        console.log('✅ Created production:', production.id);

        // Get the production steps
        const stepsResponse = await axios.get(`${BASE_URL}/production/runs/${production.id}/steps`);
        const steps = stepsResponse.data.data;
        console.log('📋 Found steps:', steps.length);

        // Complete all steps except the last one
        for (let i = 0; i < steps.length - 1; i++) {
            const step = steps[i];
            console.log(`⏳ Completing step ${i + 1}/${steps.length}: ${step.name}`);

            // Start the step
            await axios.post(`${BASE_URL}/production/steps/${step.id}/start`);

            // Complete the step
            await axios.post(`${BASE_URL}/production/steps/${step.id}/complete`, {
                notes: 'Test completion',
                qualityCheck: {
                    passed: true,
                    notes: 'All good'
                }
            });
            console.log(`✅ Completed step: ${step.name}`);
        }

        const lastStep = steps[steps.length - 1];
        console.log(`\n🎯 Now ready for the last step: ${lastStep.name}`);
        console.log(`Production ID: ${production.id}`);
        console.log(`Last Step ID: ${lastStep.id}`);
        console.log('\n📋 To test celebration:');
        console.log('1. Open the production tracker in the browser');
        console.log('2. Click on this production');
        console.log('3. Start and complete the last step');
        console.log('4. The celebration should trigger automatically!');

        // Start the last step so it's ready to complete
        await axios.post(`${BASE_URL}/production/steps/${lastStep.id}/start`);
        console.log(`🟢 Started last step: ${lastStep.name} - Ready to complete!`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCelebration();
