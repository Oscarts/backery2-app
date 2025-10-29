// Test: Finished products with same name reuse SKU produced via service
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('--- Finished Product SKU Reuse Test ---');
  try {
    // Clean up old
    await prisma.finishedProduct.deleteMany({ where: { name: { in: ['Reusable Bread'] } } });

    const unit = await prisma.unit.findFirst() || await prisma.unit.create({ data: { name: 'Piece', symbol: 'pc', category: 'COUNT', description: 'piece', isActive: true } });
    const recipeCategory = await prisma.category.findFirst({ where: { type: 'RECIPE' } }) || await prisma.category.create({ data: { name: 'FP Recipe Cat', type: 'RECIPE' } });

    // Create a basic raw material to satisfy recipe ingredient
    const rawCat = await prisma.category.findFirst({ where: { type: 'RAW_MATERIAL' } }) || await prisma.category.create({ data: { name: 'FP Raw Cat', type: 'RAW_MATERIAL' } });
    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({ data: { name: 'FP Supplier' } });
    const storage = await prisma.storageLocation.findFirst() || await prisma.storageLocation.create({ data: { name: 'FP Storage', type: 'WAREHOUSE' } });

    const flour = await prisma.rawMaterial.create({
      data: {
        name: 'Reusable Flour',
        categoryId: rawCat.id,
        supplierId: supplier.id,
        batchNumber: 'RBF-001',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 10*24*60*60*1000),
        quantity: 500,
        reservedQuantity: 0,
        unit: unit.symbol,
        unitPrice: 0.5,
        reorderLevel: 20,
        storageLocationId: storage.id,
        isContaminated: false
      }
    });

    // Create recipe
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Reusable Bread',
        description: 'Bread for SKU reuse',
        categoryId: recipeCategory.id,
        yieldQuantity: 5,
        yieldUnit: unit.symbol,
        prepTime: 5,
        cookTime: 15,
        isActive: true,
        version: 1,
        ingredients: { create: [{ rawMaterialId: flour.id, quantity: 10, unit: unit.symbol }] }
      },
      include: { ingredients: true }
    });

    // Production run 1
    const run1 = await prisma.productionRun.create({ data: { name: 'PR1', recipeId: recipe.id, targetQuantity: 2, targetUnit: unit.symbol, status: 'PLANNED', currentStepIndex: 0 } });
    await prisma.productionStep.create({ data: { productionRunId: run1.id, name: 'Mix', stepOrder: 1, status: 'COMPLETED' } });

  const pcsModule = require('./dist/services/productionCompletionService.js');
  const completeProductionRunDirect = pcsModule.completeProductionRunDirect;

    // Allocate and consume (simplified) by direct deduction
  const allocModule = require('./dist/services/inventoryAllocationService.js');
  const AllocCtor = allocModule.InventoryAllocationService || allocModule.default || allocModule;
  const allocService = new AllocCtor();
    await allocService.allocateIngredients(run1.id, recipe.id, 2);
    const allocations1 = await prisma.productionAllocation.findMany({ where: { productionRunId: run1.id } });
    for (const a of allocations1) {
      await prisma.productionAllocation.update({ where: { id: a.id }, data: { quantityConsumed: a.quantityAllocated, status: 'CONSUMED', consumedAt: new Date() } });
      if (a.materialType === 'RAW_MATERIAL') {
        await prisma.rawMaterial.update({ where: { id: a.materialId }, data: { quantity: { decrement: a.quantityAllocated }, reservedQuantity: { decrement: a.quantityAllocated } } });
      }
    }
  const result1 = await completeProductionRunDirect(run1.id);

    // Production run 2 (same recipe name)
    const run2 = await prisma.productionRun.create({ data: { name: 'PR2', recipeId: recipe.id, targetQuantity: 1, targetUnit: unit.symbol, status: 'PLANNED', currentStepIndex: 0 } });
    await prisma.productionStep.create({ data: { productionRunId: run2.id, name: 'Mix', stepOrder: 1, status: 'COMPLETED' } });
    await allocService.allocateIngredients(run2.id, recipe.id, 1);
    const allocations2 = await prisma.productionAllocation.findMany({ where: { productionRunId: run2.id } });
    for (const a of allocations2) {
      await prisma.productionAllocation.update({ where: { id: a.id }, data: { quantityConsumed: a.quantityAllocated, status: 'CONSUMED', consumedAt: new Date() } });
      if (a.materialType === 'RAW_MATERIAL') {
        await prisma.rawMaterial.update({ where: { id: a.materialId }, data: { quantity: { decrement: a.quantityAllocated }, reservedQuantity: { decrement: a.quantityAllocated } } });
      }
    }
  const result2 = await completeProductionRunDirect(run2.id);

    if (result1.finishedProduct.sku !== result2.finishedProduct.sku) {
      throw new Error('Finished product SKU not reused across runs with same recipe name');
    }

    console.log('Unified Finished Product SKU:', result1.finishedProduct.sku);
    console.log('✅ Finished product SKU reuse test passed');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
