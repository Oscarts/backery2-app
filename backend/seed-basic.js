const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding basic bakery data...\n');

  // Create some raw materials
  console.log('Creating raw materials...');
  const flour = await prisma.rawMaterial.create({
    data: {
      name: 'All-Purpose Flour',
      sku: 'RM-FLOUR-001',
      batchNumber: 'RM-BATCH-001',
      quantity: 1000,
      unit: 'kg',
      costPerUnit: 2.50,
    },
  });

  const sugar = await prisma.rawMaterial.create({
    data: {
      name: 'Granulated Sugar',
      sku: 'RM-SUGAR-001',
      batchNumber: 'RM-BATCH-002',
      quantity: 500,
      unit: 'kg',
      costPerUnit: 1.80,
    },
  });

  const butter = await prisma.rawMaterial.create({
    data: {
      name: 'Butter',
      sku: 'RM-BUTTER-001',
      batchNumber: 'RM-BATCH-003',
      quantity: 300,
      unit: 'kg',
      costPerUnit: 8.50,
    },
  });

  const eggs = await prisma.rawMaterial.create({
    data: {
      name: 'Eggs',
      sku: 'RM-EGGS-001',
      batchNumber: 'RM-BATCH-004',
      quantity: 2000,
      unit: 'units',
      costPerUnit: 0.25,
    },
  });

  console.log('✅ Created 4 raw materials\n');

  // Create some finished products
  console.log('Creating finished products...');
  const croissant = await prisma.finishedProduct.create({
    data: {
      name: 'Classic Croissant',
      sku: 'FP-CROIS-001',
      batchNumber: 'BATCH-001',
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      shelfLife: 3,
      quantity: 200,
      reservedQuantity: 0,
      unit: 'units',
      salePrice: 3.50,
      costToProduce: 1.20,
      status: 'COMPLETED',
      isContaminated: false,
    },
  });

  const baguette = await prisma.finishedProduct.create({
    data: {
      name: 'French Baguette',
      sku: 'FP-BAGUE-001',
      batchNumber: 'BATCH-002',
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      shelfLife: 2,
      quantity: 300,
      reservedQuantity: 0,
      unit: 'units',
      salePrice: 2.50,
      costToProduce: 0.80,
      status: 'COMPLETED',
      isContaminated: false,
    },
  });

  const chocolateCake = await prisma.finishedProduct.create({
    data: {
      name: 'Chocolate Cake',
      sku: 'FP-CHOCO-001',
      batchNumber: 'BATCH-003',
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      shelfLife: 7,
      quantity: 50,
      reservedQuantity: 0,
      unit: 'units',
      salePrice: 25.00,
      costToProduce: 10.00,
      status: 'COMPLETED',
      isContaminated: false,
    },
  });

  const applePie = await prisma.finishedProduct.create({
    data: {
      name: 'Apple Pie',
      sku: 'FP-APPLE-001',
      batchNumber: 'BATCH-004',
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      shelfLife: 5,
      quantity: 80,
      reservedQuantity: 0,
      unit: 'units',
      salePrice: 18.00,
      costToProduce: 7.50,
      status: 'COMPLETED',
      isContaminated: false,
    },
  });

  const danishPastry = await prisma.finishedProduct.create({
    data: {
      name: 'Danish Pastry',
      sku: 'FP-DANIS-001',
      batchNumber: 'BATCH-005',
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
      shelfLife: 4,
      quantity: 150,
      reservedQuantity: 0,
      unit: 'units',
      salePrice: 4.00,
      costToProduce: 1.50,
      status: 'COMPLETED',
      isContaminated: false,
    },
  });

  console.log('✅ Created 5 finished products\n');

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 4 Raw Materials');
  console.log('   - 5 Finished Products (all COMPLETED, not contaminated)');
  console.log('\n🎯 Ready to seed customer orders!\n');
}

seed()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
