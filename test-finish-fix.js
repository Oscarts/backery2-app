// Test script to create a simple production for finish button testing
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testFinishButtonFix() {
    try {
        console.log('🧪 Creating simple test production for finish button fix...');
        
        // Create a new production
        const productionResponse = await axios.post(`${BASE_URL}/production/runs`, {
            name: 'Quick Finish Test',
            recipeId: 'cmfbm3irr00017bqelkoydhai',
            targetQuantity: 1,
            targetUnit: 'kg',
            priority: 'HIGH',
            notes: 'Testing finish button fix - should show celebration and close properly'
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

        // Complete ALL steps to show finish button
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`⏳ Completing step ${i + 1}/${steps.length}: ${step.name}`);
            
            // Start and complete the step
            await axios.post(`${BASE_URL}/production/steps/${step.id}/start`);
            await axios.post(`${BASE_URL}/production/steps/${step.id}/complete`, {
                notes: 'Quick completion for test',
                qualityCheck: { passed: true, notes: 'All good' }
            });
            console.log(`✅ Completed step: ${step.name}`);
        }

        console.log(`\n🎯 Test production ready!`);
        console.log(`📊 Production ID: ${production.id}`);
        console.log(`📝 Production Name: ${production.name}`);
        console.log(`✅ All steps completed - finish button should appear`);
        console.log(`\n📋 Expected behavior:`);
        console.log(`1. Open production tracker → Should show "🎉 Finish Production" button`);
        console.log(`2. Click finish button → Should show celebration with confetti`);
        console.log(`3. After 4 seconds → Should auto-close and return to dashboard`);
        console.log(`4. Production should be marked as COMPLETED`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFinishButtonFix();
