const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiFixe() {
  try {
    console.log('Testing API fixes...');

    // Test 1: Get quality statuses
    const qualityStatuses = await prisma.qualityStatus.findMany();
    console.log(`✅ Found ${qualityStatuses.length} quality statuses`);

    // Test 2: Get required data
    const [categories, locations, units] = await Promise.all([
      prisma.category.findMany({ take: 1 }),
      prisma.storageLocation.findMany({ take: 1 }),
      prisma.unit.findMany({ take: 1 })
    ]);

    if (!categories[0] || !locations[0] || !units[0]) {
      throw new Error('Missing required data');
    }
    console.log('✅ Required data available');

    // Test 3: Create intermediate product with null qualityStatusId
    const testProduct = await prisma.intermediateProduct.create({
      data: {
        name: 'Test Product API Fix',
        description: 'Testing API fix',
        categoryId: categories[0].id,
        storageLocationId: locations[0].id,
        batchNumber: 'TEST' + Date.now(),
        productionDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        quantity: 10,
        unit: units[0].symbol,
        status: 'IN_PRODUCTION',
        contaminated: false,
        qualityStatusId: null
      }
    });

    console.log('✅ Successfully created intermediate product with null qualityStatusId');

    // Test 4: Update with a valid quality status
    const updatedProduct = await prisma.intermediateProduct.update({
      where: { id: testProduct.id },
      data: {
        qualityStatusId: qualityStatuses[0].id
      }
    });

    console.log('✅ Successfully updated intermediate product with quality status');

    // Cleanup
    await prisma.intermediateProduct.delete({
      where: { id: testProduct.id }
    });
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 All API fixes working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiFixe();
