// Quick test script for dynamic step management API
const API_BASE = 'http://localhost:8000/api';

async function testDynamicStepManagement() {
    try {
        console.log('🧪 Testing Dynamic Step Management API...\n');

        // First, get an existing production run
        const runsResponse = await fetch(`${API_BASE}/production/runs`);
        const runsData = await runsResponse.json();

        if (!runsData.success || !runsData.data || runsData.data.length === 0) {
            console.log('❌ No production runs found. Please create a production run first.');
            return;
        }

        const productionRun = runsData.data[0];
        console.log(`✅ Using production run: ${productionRun.name} (ID: ${productionRun.id})`);

        // Get current steps
        const stepsResponse = await fetch(`${API_BASE}/production/runs/${productionRun.id}/steps`);
        const stepsData = await stepsResponse.json();

        if (stepsData.success) {
            console.log(`📋 Current steps: ${stepsData.data.length} steps`);
            stepsData.data.forEach((step, index) => {
                console.log(`   ${index + 1}. ${step.name} (${step.status})`);
            });
        }

        // Test 1: Add a new step at the end
        console.log('\n🔧 Test 1: Adding a new step at the end...');
        const addStepResponse = await fetch(`${API_BASE}/production/runs/${productionRun.id}/steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Custom Testing Step',
                description: 'A step added dynamically for testing',
                estimatedMinutes: 15
            })
        });

        const addStepData = await addStepResponse.json();
        if (addStepData.success) {
            console.log(`✅ Successfully added step: ${addStepData.data.newStep.name}`);
            console.log(`📋 Total steps now: ${addStepData.data.allSteps.length}`);
        } else {
            console.log(`❌ Failed to add step: ${addStepData.error}`);
        }

        // Test 2: Try to remove the step we just added (if it's pending)
        if (addStepData.success && addStepData.data.newStep.status === 'PENDING') {
            console.log('\n🔧 Test 2: Removing the step we just added...');
            const removeStepResponse = await fetch(`${API_BASE}/production/steps/${addStepData.data.newStep.id}`, {
                method: 'DELETE'
            });

            const removeStepData = await removeStepResponse.json();
            if (removeStepData.success) {
                console.log(`✅ Successfully removed step`);
                console.log(`📋 Total steps now: ${removeStepData.data.allSteps.length}`);
            } else {
                console.log(`❌ Failed to remove step: ${removeStepData.error}`);
            }
        }

        console.log('\n🎉 Dynamic step management API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testDynamicStepManagement();
