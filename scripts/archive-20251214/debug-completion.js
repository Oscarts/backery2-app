const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function quickCompletionTest() {
    try {
        console.log('🧪 Quick completion test...\n');

        // Get existing production runs
        const runsResponse = await fetch(`${API_BASE}/production/runs/dashboard`);
        const runsData = await runsResponse.json();

        if (!runsData.success || !runsData.data || runsData.data.length === 0) {
            console.log('❌ No active production runs found');
            return;
        }

        const production = runsData.data[0];
        console.log(`📋 Testing with production: ${production.name}`);

        // Get production steps
        const stepsResponse = await fetch(`${API_BASE}/production/runs/${production.id}/steps`);
        const stepsData = await stepsResponse.json();

        if (!stepsData.success || !stepsData.data) {
            console.log('❌ Failed to get production steps');
            return;
        }

        const steps = stepsData.data;
        console.log(`📝 Found ${steps.length} steps`);

        // Find in-progress step or start and complete one
        let targetStep = steps.find(s => s.status === 'IN_PROGRESS');

        if (!targetStep) {
            // Find first pending step and start it
            targetStep = steps.find(s => s.status === 'PENDING');
            if (targetStep) {
                console.log(`⏳ Starting step: ${targetStep.name}`);
                await fetch(`${API_BASE}/production/steps/${targetStep.id}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (targetStep) {
            console.log(`✅ Completing step: ${targetStep.name}`);
            const completeResponse = await fetch(`${API_BASE}/production/steps/${targetStep.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: 'Quick test completion',
                    qualityCheckPassed: true
                })
            });

            const completeData = await completeResponse.json();
            console.log('\n📊 Complete API Response:');
            console.log(JSON.stringify(completeData, null, 2));

            if (completeData.data?.productionCompleted) {
                console.log('\n🎉 Production completed! Check the UI for celebration!');
            } else {
                console.log('\n⏳ Step completed but production continues...');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

quickCompletionTest();
