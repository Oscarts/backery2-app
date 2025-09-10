const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function testCompletionFlow() {
    try {
        console.log('🧪 Testing Production Completion Flow...\n');

        // 1. Get existing production runs
        const runsResponse = await fetch(`${API_BASE}/production/runs/dashboard`);
        const runsData = await runsResponse.json();

        if (!runsData.success || !runsData.data || runsData.data.length === 0) {
            console.log('❌ No active production runs found. Please start a production first.');
            return;
        }

        const production = runsData.data[0];
        console.log(`📋 Found production: ${production.name}`);

        // 2. Get production steps
        const stepsResponse = await fetch(`${API_BASE}/production/runs/${production.id}/steps`);
        const stepsData = await stepsResponse.json();

        if (!stepsData.success || !stepsData.data) {
            console.log('❌ Failed to get production steps');
            return;
        }

        const steps = stepsData.data;
        console.log(`📝 Found ${steps.length} steps`);

        // 3. Find a step that can be completed (IN_PROGRESS or complete all PENDING steps)
        const inProgressStep = steps.find(s => s.status === 'IN_PROGRESS');
        const pendingSteps = steps.filter(s => s.status === 'PENDING');

        if (inProgressStep) {
            console.log(`\n⏳ Completing in-progress step: ${inProgressStep.name}`);
            const completeResponse = await fetch(`${API_BASE}/production/steps/${inProgressStep.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: 'Test completion',
                    qualityCheckPassed: true
                })
            });

            const completeData = await completeResponse.json();
            console.log('✅ Step completion response:', JSON.stringify(completeData, null, 2));

            if (completeData.data?.productionCompleted) {
                console.log('\n🎉 PRODUCTION COMPLETED! Celebration should trigger!');
                console.log('📊 Completed Production Data:', completeData.data.completedProductionRun);
            }
        } else {
            console.log('\n⚠️  No in-progress steps. You can:');
            console.log('1. Start a step first, then complete it');
            console.log('2. Or run the production tracker UI to complete steps manually');
        }

    } catch (error) {
        console.error('❌ Error testing completion flow:', error);
    }
}

testCompletionFlow();
