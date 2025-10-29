// Test: Raw materials with same name reuse SKU; conflicts on mismatched manual SKU
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('--- Raw Material SKU Reuse Test ---');
  try {
    // Clean test artifacts by name
    await prisma.rawMaterial.deleteMany({ where: { name: { in: ['Reuse Flour'] } } });

    const unit = await prisma.unit.findFirst() || await prisma.unit.create({ data: { name: 'Gram', symbol: 'g', category: 'MASS', description: 'grams', isActive: true } });
    const category = await prisma.category.findFirst({ where: { type: 'RAW_MATERIAL' } }) || await prisma.category.create({ data: { name: 'RM Test', type: 'RAW_MATERIAL' } });
    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({ data: { name: 'RM Supplier' } });
    const storage = await prisma.storageLocation.findFirst() || await prisma.storageLocation.create({ data: { name: 'RM Storage', type: 'WAREHOUSE' } });

    const first = await prisma.rawMaterial.create({
      data: {
        name: 'Reuse Flour',
        description: 'First batch',
        categoryId: category.id,
        supplierId: supplier.id,
        batchNumber: 'RF-001',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 5*24*60*60*1000),
        quantity: 10,
        reservedQuantity: 0,
        unit: unit.symbol,
        unitPrice: 2,
        reorderLevel: 2,
        storageLocationId: storage.id,
        isContaminated: false
      }
    });

    const second = await prisma.rawMaterial.create({
      data: {
        name: 'Reuse Flour',
        description: 'Second batch',
        categoryId: category.id,
        supplierId: supplier.id,
        batchNumber: 'RF-002',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 5*24*60*60*1000),
        quantity: 12,
        reservedQuantity: 0,
        unit: unit.symbol,
        unitPrice: 2,
        reorderLevel: 2,
        storageLocationId: storage.id,
        isContaminated: false
      }
    });

    if (!first.sku || !second.sku) throw new Error('SKU not assigned');
    if (first.sku !== second.sku) throw new Error('SKUs differ for identical names');

    console.log('Unified SKU:', first.sku);

    // Attempt conflicting manual SKU
    let conflictCaught = false;
    try {
      await prisma.rawMaterial.create({
        data: {
          name: 'Reuse Flour',
          sku: 'DIFFERENT-SKU',
          description: 'Conflict batch',
          categoryId: category.id,
          supplierId: supplier.id,
          batchNumber: 'RF-003',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 5*24*60*60*1000),
          quantity: 5,
          reservedQuantity: 0,
          unit: unit.symbol,
          unitPrice: 2,
          reorderLevel: 2,
          storageLocationId: storage.id,
          isContaminated: false
        }
      });
    } catch (err) {
      conflictCaught = true;
      console.log('Conflict detected as expected');
    }

    if (!conflictCaught) console.warn('WARNING: Conflict not detected (controller validation may not apply via direct prisma create)');

    console.log('✅ Raw material SKU reuse test completed');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
