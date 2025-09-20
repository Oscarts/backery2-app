/**
 * Simple JavaScript test for Material Tracking functionality
 * Tests the new APIs for tracking raw materials used in production runs
 */

const { PrismaClient } = require('@prisma/client');
const { InventoryAllocationService } = require('./dist/services/inventoryAllocationService');

const prisma = new PrismaClient();
const inventoryService = new InventoryAllocationService();

async function testMaterialTracking() {
  console.log('🧪 Testing Material Tracking System\n');

  let testData = {};

  try {
    // Get existing test data from simple seed
    console.log('1️⃣ Getting test data from database...');
    
    const supplier = await prisma.supplier.findFirst();
    const storageLocation = await prisma.storageLocation.findFirst();
    const rawMaterial = await prisma.rawMaterial.findFirst();
    const recipe = await prisma.recipe.findFirst({
      include: { ingredients: true }
    });

    if (!supplier || !storageLocation || !rawMaterial || !recipe) {
      throw new Error('Test data not found. Please run create-simple-seed-data.js first');
    }

    // Create a test production run
    const productionRun = await prisma.productionRun.create({
      data: {
        name: 'Material Tracking Test Run',
        recipeId: recipe.id,
        targetQuantity: 4.0,
        targetUnit: 'loaves',
        status: 'PLANNED'
      }
    });

    testData = { supplier, storageLocation, rawMaterial, recipe, productionRun };
    console.log(`✅ Test production run created: ${productionRun.id}`);

    // Test 1: Material Allocation
    console.log('\n2️⃣ Testing material allocation...');
    const allocations = await inventoryService.allocateIngredients(
      productionRun.id,
      recipe.id,
      2 // Production multiplier for 4 loaves (recipe yields 2)
    );

    console.log(`✅ Allocated ${allocations.length} materials`);
    if (allocations.length > 0) {
      console.log(`   - ${allocations[0].materialName}: ${allocations[0].quantityAllocated} ${allocations[0].unit}`);
      console.log(`   - Cost: $${allocations[0].totalCost.toFixed(2)} (${allocations[0].unitCost}/unit)`);
      console.log(`   - SKU: ${allocations[0].materialSku}`);
      console.log(`   - Batch: ${allocations[0].materialBatchNumber}`);
    }

    // Test 2: Material Usage Retrieval
    console.log('\n3️⃣ Testing material usage retrieval...');
    const materials = await inventoryService.getMaterialUsage(productionRun.id);
    console.log(`✅ Retrieved ${materials.length} material usage records`);
    
    // Test 3: Cost Calculation
    console.log('\n4️⃣ Testing cost calculation...');
    const costBreakdown = await inventoryService.calculateProductionCost(productionRun.id);
    console.log(`✅ Cost breakdown calculated:`);
    console.log(`   - Material Cost: $${costBreakdown.materialCost.toFixed(2)}`);
    console.log(`   - Total Cost: $${costBreakdown.totalCost.toFixed(2)} (includes 20% overhead)`);

    // Test 4: Material Consumption
    if (materials.length > 0) {
      console.log('\n5️⃣ Testing material consumption recording...');
      const consumptions = [{
        allocationId: materials[0].id,
        quantityConsumed: materials[0].quantityAllocated * 0.95, // 5% waste
        notes: 'Test consumption with 5% waste'
      }];
      
      await inventoryService.recordMaterialConsumption(consumptions);
      console.log(`✅ Recorded consumption: ${consumptions[0].quantityConsumed} units with 5% waste`);
    }

    // Test 5: Create finished product and test traceability
    console.log('\n6️⃣ Testing finished product traceability...');
    const finishedProduct = await prisma.finishedProduct.create({
      data: {
        name: 'Test Bread Product',
        sku: 'TEST-BREAD-001',
        batchNumber: 'TEST-BATCH-001',
        productionDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        shelfLife: 7,
        quantity: 4.0,
        unit: 'loaves',
        salePrice: 5.00,
        costToProduce: costBreakdown.totalCost,
        productionRunId: productionRun.id, // Link to production run
        status: 'COMPLETED'
      }
    });

    // Test the finished product materials API (simulated)
    const finishedProductMaterials = await inventoryService.getMaterialUsage(productionRun.id);
    const finishedProductCosts = await inventoryService.calculateProductionCost(productionRun.id);
    
    console.log(`✅ Finished product traceability:`);
    console.log(`   - Product: ${finishedProduct.name} (${finishedProduct.quantity} ${finishedProduct.unit})`);
    console.log(`   - Materials used: ${finishedProductMaterials.length}`);
    console.log(`   - Total cost: $${finishedProductCosts.totalCost.toFixed(2)}`);
    console.log(`   - Cost per unit: $${(finishedProductCosts.totalCost / finishedProduct.quantity).toFixed(2)}`);

    console.log('\n🎉 All material tracking tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    if (testData.productionRun) {
      await prisma.finishedProduct.deleteMany({
        where: { productionRunId: testData.productionRun.id }
      });
      await prisma.productionAllocation.deleteMany({
        where: { productionRunId: testData.productionRun.id }
      });
      await prisma.productionStep.deleteMany({
        where: { productionRunId: testData.productionRun.id }
      });
      await prisma.productionRun.delete({
        where: { id: testData.productionRun.id }
      });
      console.log('✅ Test data cleaned up');
    }
    
    await prisma.$disconnect();
  }
}

// Run the test
testMaterialTracking();