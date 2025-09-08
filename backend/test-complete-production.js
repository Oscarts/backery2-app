const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000';

async function testCompleteProductionWorkflow() {
  console.log('🧪 Testing Complete Production Workflow - Creating Finished Products\n');

  try {
    // Get our test production run
    const runsResponse = await fetch(`${BASE_URL}/api/production/runs`);
    const runsData = await runsResponse.json();
    const runs = runsData.data || runsData;

    if (runs.length === 0) {
      console.log('❌ No production runs found');
      return;
    }

    const testRun = runs[0];
    console.log(`📋 Working with production run: ${testRun.name} (Status: ${testRun.status})`);

    // Get all steps for this run
    const stepsResponse = await fetch(`${BASE_URL}/api/production/runs/${testRun.id}/steps`);
    const steps = await stepsResponse.json();
    console.log(`   Found ${steps.length} steps`);

    // Complete all steps one by one
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n🔄 Processing step ${i + 1}: ${step.name} (Status: ${step.status})`);

      // Start step if not started
      if (step.status === 'PENDING') {
        console.log('   ▶️  Starting step...');
        const startResponse = await fetch(`${BASE_URL}/api/production/steps/${step.id}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: `Started ${step.name} step` })
        });

        if (startResponse.ok) {
          console.log('   ✅ Step started successfully');
        } else {
          console.log('   ❌ Failed to start step');
          continue;
        }
      }

      // Add a quality checkpoint
      console.log('   🔍 Adding quality checkpoint...');
      const qualityResponse = await fetch(`${BASE_URL}/api/production/steps/${step.id}/quality-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointType: 'mid-process',
          qualityStatus: 'PASS',
          measurements: {
            temperature: 350 + Math.random() * 50,
            weight: 500 + Math.random() * 100,
            ph: 6.8 + Math.random() * 0.4
          },
          notes: `Quality check passed for ${step.name}`
        })
      });

      if (qualityResponse.ok) {
        console.log('   ✅ Quality checkpoint logged');
      }

      // Complete the step
      console.log('   🏁 Completing step...');
      const completeResponse = await fetch(`${BASE_URL}/api/production/steps/${step.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: `Completed ${step.name} step`,
          qualityCheckPassed: true,
          actualMinutes: step.estimatedMinutes || 30,
          yieldQuantity: i === steps.length - 1 ? testRun.targetQuantity : undefined // Final yield on last step
        })
      });

      if (completeResponse.ok) {
        const result = await completeResponse.json();
        console.log('   ✅ Step completed successfully');

        // Check if this was the final step
        if (result.productionCompleted) {
          console.log('\n🎉 PRODUCTION COMPLETED! 🎉');
          console.log('   📦 Production run finished');

          if (result.createdFinishedProduct) {
            console.log('   🍞 Finished product created:');
            console.log(`      Name: ${result.createdFinishedProduct.name}`);
            console.log(`      Quantity: ${result.createdFinishedProduct.quantity} ${result.createdFinishedProduct.unit}`);
            console.log(`      Batch: ${result.createdFinishedProduct.batchNumber}`);
            console.log(`      SKU: ${result.createdFinishedProduct.sku}`);
            console.log(`      Cost: $${result.createdFinishedProduct.costToProduce}`);
          }
        }
      } else {
        console.log('   ❌ Failed to complete step');
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify the finished products were created
    console.log('\n📦 Checking finished products inventory...');
    const finishedProductsResponse = await fetch(`${BASE_URL}/api/finished-products`);
    if (finishedProductsResponse.ok) {
      const finishedProductsData = await finishedProductsResponse.json();
      const finishedProducts = finishedProductsData.data || finishedProductsData;

      console.log(`   Found ${finishedProducts.length} finished products in inventory:`);
      finishedProducts.forEach((product, idx) => {
        console.log(`   ${idx + 1}. ${product.name} - ${product.quantity} ${product.unit} (${product.status})`);
      });
    }

    // Check updated production run status
    console.log('\n📋 Checking final production run status...');
    const finalRunResponse = await fetch(`${BASE_URL}/api/production/runs/${testRun.id}`);
    if (finalRunResponse.ok) {
      const finalRun = await finalRunResponse.json();
      const runData = finalRun.data || finalRun;
      console.log(`   Production run status: ${runData.status}`);
      console.log(`   Final quantity: ${runData.finalQuantity || 'Not set'}`);
      console.log(`   Completed at: ${runData.completedAt || 'Not completed'}`);
    }

    console.log('\n🎯 Complete production workflow test finished!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteProductionWorkflow();
