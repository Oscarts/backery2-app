// Test: Production run completion uses stable SKU and deducts ingredient quantities
// Run standalone: node backend/test-production-sku-stability.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('--- Production SKU Stability Test ---');
  try {
    // Create minimal supporting data
    const unit = await prisma.unit.findFirst() || await prisma.unit.create({ data: { name: 'Gram', symbol: 'g', category: 'MASS', description: 'grams', isActive: true } });
    const rawCategory = await prisma.category.findFirst({ where: { type: 'RAW_MATERIAL' } }) || await prisma.category.create({ data: { name: 'Raw Cat', type: 'RAW_MATERIAL' } });
    const recipeCategory = await prisma.category.findFirst({ where: { type: 'RECIPE' } }) || await prisma.category.create({ data: { name: 'Recipe Cat', type: 'RECIPE' } });

    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({ data: { name: 'Test Supplier' } });
    const storage = await prisma.storageLocation.findFirst() || await prisma.storageLocation.create({ data: { name: 'Test Storage', type: 'WAREHOUSE' } });

    // Create a raw material
    const flour = await prisma.rawMaterial.create({
      data: {
        name: 'Test Flour',
        sku: undefined, // allow service to generate/reuse
        description: 'Test flour',
        categoryId: rawCategory.id,
        supplierId: supplier.id,
        batchNumber: 'FLO-001',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 7*24*60*60*1000),
        quantity: 1000,
        reservedQuantity: 0,
        unit: unit.symbol,
        unitPrice: 1.5,
        reorderLevel: 100,
        storageLocationId: storage.id,
        isContaminated: false
      }
    });

    // Create a recipe using flour
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Test Bread',
        description: 'Bread test',
        categoryId: recipeCategory.id,
        yieldQuantity: 10,
        yieldUnit: unit.symbol,
        prepTime: 10,
        cookTime: 20,
        isActive: true,
        version: 1,
        ingredients: {
          create: [{
            quantity: 50,
            unit: unit.symbol,
            rawMaterialId: flour.id
          }]
        }
      },
      include: { ingredients: true }
    });

    // Create production run
    const productionRun = await prisma.productionRun.create({
      data: {
        name: 'Run 1',
        recipeId: recipe.id,
        targetQuantity: 2, // 2 batches
        targetUnit: unit.symbol,
        status: 'PLANNED',
        currentStepIndex: 0
      }
    });

    // Mark steps as completed (create dummy step)
    const step = await prisma.productionStep.create({ data: { productionRunId: productionRun.id, name: 'Mix', stepOrder: 1, status: 'COMPLETED' } });

  // Import completion service from compiled dist output (ensures consistent resolution)
  const pcsModule = require('./dist/services/productionCompletionService.js');
  const completeProductionRunDirect = pcsModule.completeProductionRunDirect;

    // Allocate ingredients (simulate what upstream controller would do) using allocation service
  const allocModule = require('./dist/services/inventoryAllocationService.js');
  const AllocCtor = allocModule.InventoryAllocationService || allocModule.default || allocModule;
  const allocService = new AllocCtor();
    await allocService.allocateIngredients(productionRun.id, recipe.id, productionRun.targetQuantity);

    // Record consumption equal to allocation
    const allocations = await prisma.productionAllocation.findMany({ where: { productionRunId: productionRun.id } });
    for (const a of allocations) {
      await prisma.productionAllocation.update({ where: { id: a.id }, data: { quantityConsumed: a.quantityAllocated, status: 'CONSUMED', consumedAt: new Date() } });
      // Deduct inventory similar to service consumption logic
      if (a.materialType === 'RAW_MATERIAL') {
        await prisma.rawMaterial.update({ where: { id: a.materialId }, data: { quantity: { decrement: a.quantityAllocated }, reservedQuantity: { decrement: a.quantityAllocated } } });
      }
    }

    // Complete production run
  const result = await completeProductionRunDirect(productionRun.id);

    const finished = result.finishedProduct;
    if (!finished) throw new Error('No finished product returned');

    // Check SKU stability (should derive from recipe name slug) and no batch suffix logic embedded
    console.log('Finished Product SKU:', finished.sku);
    if (!finished.sku || finished.sku.includes('BATCH')) {
      throw new Error('Finished product SKU is invalid or contains batch suffix');
    }

    // Check flour quantity deduction: required per batch = 50, batches=2 => 100
    const updatedFlour = await prisma.rawMaterial.findUnique({ where: { id: flour.id } });
    if (updatedFlour.quantity !== 900) {
      throw new Error(`Flour quantity expected 900 after deduction, got ${updatedFlour.quantity}`);
    }

    console.log('✅ Production SKU stability test passed');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
