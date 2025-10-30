/**
 * Test Material Breakdown API Fix
 * 
 * This test verifies that the material breakdown endpoint is accessible
 * and returns proper data for finished products created via production runs.
 */

const BASE_URL = 'http://localhost:8000/api';

async function testMaterialBreakdownEndpoint() {
  console.log('🧪 Testing Material Breakdown API Fix\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get a finished product that has a production run
    console.log('\n📦 Step 1: Fetching finished products...');
    const productsResponse = await fetch(`${BASE_URL}/finished-products`);
    const productsData = await productsResponse.json();
    
    if (!productsData.success || !productsData.data || productsData.data.length === 0) {
      console.log('⚠️  No finished products found. Create a production run first.');
      return;
    }

    // Find a product with a productionRunId
    const productWithProductionRun = productsData.data.find(p => p.productionRunId);
    
    if (!productWithProductionRun) {
      console.log('⚠️  No finished products with production runs found.');
      console.log('   Create a recipe and run a production first to test material breakdown.');
      return;
    }

    console.log(`✅ Found product: ${productWithProductionRun.name} (${productWithProductionRun.id})`);
    console.log(`   Batch: ${productWithProductionRun.batchNumber}`);
    console.log(`   Production Run ID: ${productWithProductionRun.productionRunId}`);

    // Step 2: Test the material breakdown endpoint
    console.log('\n🔍 Step 2: Fetching material breakdown...');
    const breakdownResponse = await fetch(
      `${BASE_URL}/production/finished-products/${productWithProductionRun.id}/materials`
    );
    
    if (!breakdownResponse.ok) {
      throw new Error(`HTTP ${breakdownResponse.status}: ${breakdownResponse.statusText}`);
    }

    const breakdownData = await breakdownResponse.json();

    if (!breakdownData.success) {
      throw new Error(breakdownData.error || 'API returned success: false');
    }

    console.log('✅ Material breakdown retrieved successfully!');
    console.log('\n📊 Breakdown Summary:');
    console.log(`   Total Materials Used: ${breakdownData.data.summary.totalMaterialsUsed}`);
    console.log(`   Total Material Cost: $${breakdownData.data.summary.totalMaterialCost.toFixed(2)}`);
    console.log(`   Total Production Cost: $${breakdownData.data.summary.totalProductionCost.toFixed(2)}`);
    console.log(`   Cost Per Unit: $${breakdownData.data.summary.costPerUnit.toFixed(2)}`);

    // Step 3: Display materials used
    if (breakdownData.data.materials && breakdownData.data.materials.length > 0) {
      console.log('\n📋 Materials Used:');
      breakdownData.data.materials.forEach((material, index) => {
        console.log(`   ${index + 1}. ${material.materialName || 'N/A'}`);
        console.log(`      Quantity: ${material.quantityUsed} ${material.unit || ''}`);
        console.log(`      Cost: $${(material.unitCost * material.quantityUsed).toFixed(2)}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! Material breakdown is working correctly.');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testMaterialBreakdownEndpoint();
