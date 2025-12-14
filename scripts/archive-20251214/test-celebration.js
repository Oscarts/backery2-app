const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function createAndCompleteProduction() {
    try {
        console.log('🚀 Creating new production for testing...\n');

        // 1. Get available recipes
        const recipesResponse = await fetch(`${API_BASE}/recipes`);
        const recipesData = await recipesResponse.json();

        if (!recipesData.success || !recipesData.data || recipesData.data.length === 0) {
            console.log('❌ No recipes found');
            return;
        }

        const recipe = recipesData.data[0];
        console.log(`📋 Using recipe: ${recipe.name}`);

        // 2. Create production run
        const productionData = {
            name: `Test Production - ${recipe.name}`,
            recipeId: recipe.id,
            targetQuantity: 2,
            targetUnit: recipe.yieldUnit,
            notes: 'Test production for celebration animation'
        };

        const createResponse = await fetch(`${API_BASE}/production/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productionData)
        });

        const createData = await createResponse.json();
        if (!createData.success) {
            console.log('❌ Failed to create production:', createData.error);
            return;
        }

        const productionId = createData.data.id;
        console.log(`✅ Created production: ${productionId}`);

        // 3. Get production steps
        const stepsResponse = await fetch(`${API_BASE}/production/runs/${productionId}/steps`);
        const stepsData = await stepsResponse.json();

        if (!stepsData.success) {
            console.log('❌ Failed to get steps');
            return;
        }

        const steps = stepsData.data;
        console.log(`📝 Found ${steps.length} steps to complete`);

        // 4. Complete all steps one by one
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`\n⏳ Processing step ${i + 1}/${steps.length}: ${step.name}`);

            // Start step
            const startResponse = await fetch(`${API_BASE}/production/steps/${step.id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log(`  ▶️  Started step: ${startResponse.ok ? '✅' : '❌'}`);

            // Complete step
            const completeResponse = await fetch(`${API_BASE}/production/steps/${step.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: `Completed step ${i + 1}`,
                    qualityCheckPassed: true
                })
            });

            const completeData = await completeResponse.json();
            console.log(`  ✅ Completed step: ${completeResponse.ok ? '✅' : '❌'}`);

            if (completeData.data?.productionCompleted) {
                console.log('\n🎉🎉🎉 PRODUCTION COMPLETED! 🎉🎉🎉');
                console.log('🎊 Celebration animation should now appear in the UI!');
                console.log('📊 Production data:', JSON.stringify(completeData.data.completedProductionRun, null, 2));
                break;
            }
        }

        console.log('\n✅ Test completed! Check the UI for the celebration animation.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createAndCompleteProduction();
