// Test Production Workflow - Step Tracking System
const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function testProductionWorkflow() {
    console.log('🧪 Testing Production Step Tracking Workflow\n');

    try {
        // 1. Get available recipes
        console.log('1. 📋 Fetching available recipes...');
        const recipesResponse = await fetch(`${API_BASE}/recipes`);
        const recipesData = await recipesResponse.json();
        
        if (!recipesData.success || !recipesData.data.length) {
            console.error('❌ No recipes found!');
            return;
        }
        
        const recipe = recipesData.data[0]; // Use first recipe
        console.log(`✅ Found recipe: ${recipe.name}`);

        // 2. Create a production run
        console.log('\n2. 🏭 Creating production run...');
        const productionData = {
            name: `Test ${recipe.name} Production`,
            recipeId: recipe.id,
            targetQuantity: 10,
            targetUnit: recipe.yieldUnit || 'units',
            notes: 'Test production run for step tracking'
        };

        const createResponse = await fetch(`${API_BASE}/production/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productionData)
        });

        const productionRun = await createResponse.json();
        if (!productionRun.success) {
            console.error('❌ Failed to create production run:', productionRun.error);
            return;
        }

        console.log(`✅ Created production run: ${productionRun.data.name}`);
        console.log(`📋 Production steps: ${productionRun.data.steps.length}`);

        // 3. List production steps
        console.log('\n3. 📝 Production steps:');
        productionRun.data.steps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step.name} (${step.status}) - ~${step.estimatedMinutes}min`);
        });

        // 4. Start first step
        const firstStep = productionRun.data.steps[0];
        console.log(`\n4. ▶️  Starting first step: ${firstStep.name}`);
        
        const startResponse = await fetch(`${API_BASE}/production/steps/${firstStep.id}/start`, {
            method: 'POST'
        });

        const startedStep = await startResponse.json();
        if (startedStep.success) {
            console.log(`✅ Step started successfully at ${new Date(startedStep.data.actualStartTime).toLocaleTimeString()}`);
        } else {
            console.error('❌ Failed to start step:', startedStep.error);
        }

        // 5. Complete first step
        console.log('\n5. ✅ Completing first step...');
        const completeResponse = await fetch(`${API_BASE}/production/steps/${firstStep.id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notes: 'Test step completion - all ingredients prepared successfully'
            })
        });

        const completedStep = await completeResponse.json();
        if (completedStep.success) {
            console.log(`✅ Step completed successfully at ${new Date(completedStep.data.actualEndTime).toLocaleTimeString()}`);
            console.log(`📝 Notes: ${completedStep.data.notes}`);
        } else {
            console.error('❌ Failed to complete step:', completedStep.error);
        }

        // 6. Get updated production run to see current status
        console.log('\n6. 📊 Checking production status...');
        const statusResponse = await fetch(`${API_BASE}/production/runs/${productionRun.data.id}`);
        const updatedProduction = await statusResponse.json();
        
        if (updatedProduction.success) {
            console.log(`📈 Production status: ${updatedProduction.data.status}`);
            console.log('📋 Current step statuses:');
            updatedProduction.data.steps.forEach((step, index) => {
                const status = step.status === 'COMPLETED' ? '✅' : 
                              step.status === 'IN_PROGRESS' ? '⏳' : '⏸️';
                console.log(`   ${index + 1}. ${step.name} ${status} ${step.status}`);
                if (step.actualStartTime) {
                    console.log(`      Started: ${new Date(step.actualStartTime).toLocaleTimeString()}`);
                }
                if (step.actualEndTime) {
                    console.log(`      Completed: ${new Date(step.actualEndTime).toLocaleTimeString()}`);
                }
            });
        }

        console.log('\n🎉 Production step tracking test completed successfully!');
        console.log('\n🌐 You can now test the UI at: http://localhost:3005');
        console.log('   Navigate to Production → View the created production run');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testProductionWorkflow().catch(console.error);
