const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000';

async function testProductionStepEndpoints() {
  console.log('🧪 Testing Production Step Tracking Endpoints\n');

  try {
    // Test 1: Get production runs to find one with steps
    console.log('1. Fetching production runs...');
    const runsResponse = await fetch(`${BASE_URL}/api/production/runs`);
    if (!runsResponse.ok) {
      throw new Error(`Failed to fetch runs: ${runsResponse.status}`);
    }
    const runsData = await runsResponse.json();
    const runs = runsData.data || runsData; // Handle both response formats
    console.log(`   Found ${runs.length} production runs`);
    
    if (runs.length === 0) {
      console.log('❌ No production runs found. Please create some test data first.');
      return;
    }

    const firstRun = runs[0];
    console.log(`   Testing with run: ${firstRun.name} (ID: ${firstRun.id})`);

    // Test 2: Get production steps for the run
    console.log('\n2. Fetching production steps...');
    const stepsResponse = await fetch(`${BASE_URL}/api/production/runs/${firstRun.id}/steps`);
    if (!stepsResponse.ok) {
      throw new Error(`Failed to fetch steps: ${stepsResponse.status}`);
    }
    const steps = await stepsResponse.json();
    console.log(`   Found ${steps.length} steps for this run`);
    
    if (steps.length === 0) {
      console.log('❌ No production steps found for this run.');
      return;
    }

    const firstStep = steps[0];
    console.log(`   Testing with step: ${firstStep.name} (ID: ${firstStep.id})`);
    console.log(`   Current status: ${firstStep.status}`);

    // Test 3: Start a production step (if not already started)
    if (firstStep.status === 'PENDING') {
      console.log('\n3. Starting production step...');
      const startResponse = await fetch(`${BASE_URL}/api/production/steps/${firstStep.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Test starting step via API'
        })
      });
      
      if (startResponse.ok) {
        const startedStep = await startResponse.json();
        console.log(`   ✅ Step started successfully! Status: ${startedStep.status}`);
        console.log(`   Started at: ${startedStep.startedAt}`);
      } else {
        console.log(`   ❌ Failed to start step: ${startResponse.status}`);
      }
    } else {
      console.log('\n3. Step already started, skipping start test');
    }

    // Test 4: Log a quality checkpoint
    console.log('\n4. Logging quality checkpoint...');
    const qualityResponse = await fetch(`${BASE_URL}/api/production/steps/${firstStep.id}/quality-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkpointType: 'mid-process',
        qualityStatus: 'PASS',
        measurements: {
          temperature: 350,
          ph: 7.2,
          weight: 500
        },
        notes: 'Quality check passed - good consistency'
      })
    });

    if (qualityResponse.ok) {
      const qualityResult = await qualityResponse.json();
      console.log(`   ✅ Quality checkpoint logged successfully!`);
      console.log(`   Checkpoint type: ${qualityResult.checkpoint.checkpointType}`);
      console.log(`   Quality status: ${qualityResult.checkpoint.qualityStatus}`);
    } else {
      console.log(`   ❌ Failed to log quality checkpoint: ${qualityResponse.status}`);
    }

    // Test 5: Get step by ID to see updated data
    console.log('\n5. Fetching updated step data...');
    const stepResponse = await fetch(`${BASE_URL}/api/production/steps/${firstStep.id}`);
    if (stepResponse.ok) {
      const updatedStep = await stepResponse.json();
      console.log(`   ✅ Step data retrieved successfully!`);
      console.log(`   Status: ${updatedStep.status}`);
      console.log(`   Quality checks: ${updatedStep.qualityCheckData ? 'Present' : 'None'}`);
      console.log(`   Efficiency score: ${updatedStep.efficiencyScore || 'Not calculated'}`);
    } else {
      console.log(`   ❌ Failed to fetch step: ${stepResponse.status}`);
    }

    console.log('\n🎉 Production step tracking API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductionStepEndpoints();
