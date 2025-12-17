const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const fpCount = await prisma.finishedProduct.count();
  const rmCount = await prisma.rawMaterial.count();
  
  console.log('Database Status:');
  console.log(`  Finished Products: ${fpCount}`);
  console.log(`  Raw Materials: ${rmCount}`);
  
  if (fpCount > 0) {
    const fps = await prisma.finishedProduct.findMany({
      take: 5,
      select: {
        name: true,
        sku: true,
        status: true,
        isContaminated: true,
        costToProduce: true,
        salePrice: true,
      },
    });
    console.log('\nSample Finished Products:');
    fps.forEach(fp => {
      console.log(`  - ${fp.name} (${fp.sku}) - ${fp.status} - Cost: ${fp.costToProduce || fp.salePrice}`);
    });
  }
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
