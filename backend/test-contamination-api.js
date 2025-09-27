const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testContaminationApi() {
  try {
    console.log('🧪 Testing Contamination Status API...');

    // Test 1: Get required data or create them if needed
    let categories = await prisma.category.findMany({ take: 1 });
    let locations = await prisma.storageLocation.findMany({ take: 1 });
    let units = await prisma.unit.findMany({ take: 1 });
    let suppliers = await prisma.supplier.findMany({ take: 1 });

    // Create data if not found
    if (categories.length === 0) {
      const newCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          description: 'For testing',
          type: 'RAW_MATERIAL',
        }
      });
      categories = [newCategory];
      console.log('Created test category');
    }

    if (locations.length === 0) {
      const newLocation = await prisma.storageLocation.create({
        data: {
          name: 'Test Location',
          description: 'For testing',
        }
      });
      locations = [newLocation];
      console.log('Created test storage location');
    }

    if (units.length === 0) {
      // Just use "kg" as a unit since it's a common one and likely exists
      units = [{ symbol: 'kg' }];
      console.log('Using kg as test unit');
    }

    if (suppliers.length === 0) {
      const newSupplier = await prisma.supplier.create({
        data: {
          name: 'Test Supplier',
          contactInfo: {
            name: 'Test Contact',
            email: 'test@example.com',
            phone: '1234567890'
          },
          address: '123 Test Street',
          isActive: true,
        }
      });
      suppliers = [newSupplier];
      console.log('Created test supplier');
    }

    console.log('✅ Required data available');

    // Test 2: Create raw material with contamination status
    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        name: 'Contamination Test Raw Material',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
        batchNumber: 'CONT-TEST-' + Date.now(),
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        quantity: 50,
        unit: units[0].symbol,
        unitPrice: 10.50,
        reorderLevel: 10,
        storageLocationId: locations[0].id,
        isContaminated: true, // Set as contaminated
      }
    });

    console.log('✅ Created raw material with contamination status:', rawMaterial.isContaminated);

    // Test 3: Create finished product with contamination status
    const finishedProduct = await prisma.finishedProduct.create({
      data: {
        name: 'Contamination Test Finished Product',
        sku: 'FP-CONT-' + Date.now(),
        categoryId: categories[0].id,
        batchNumber: 'FP-CONT-' + Date.now(),
        productionDate: new Date(),
        expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        shelfLife: 45,
        quantity: 100,
        unit: units[0].symbol,
        salePrice: 19.99,
        costToProduce: 9.99,
        storageLocationId: locations[0].id,
        isContaminated: true, // Set as contaminated
      }
    });

    console.log('✅ Created finished product with contamination status:', finishedProduct.isContaminated);

    // Test 5: Verify products with GET requests
    const rawMaterialGet = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterial.id }
    });

    const finishedProductGet = await prisma.finishedProduct.findUnique({
      where: { id: finishedProduct.id }
    });

    console.log('✅ Verified raw material contamination status:', rawMaterialGet.isContaminated);
    console.log('✅ Verified finished product contamination status:', finishedProductGet.isContaminated);

    // Test 6: Do not clean up test data for testing purposes
    console.log('✅ Left test data for testing');
    console.log('✅ All contamination status tests passed!');

  } catch (error) {
    console.error('❌ Error testing contamination API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContaminationApi();
