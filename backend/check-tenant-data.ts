import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@test.com';
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: true }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`\n👤 User: ${user.email}`);
  console.log(`🏢 Client: ${user.client?.name} (${user.clientId})\n`);
  
  // Count raw materials for this tenant
  const rawMaterialsCount = await prisma.rawMaterial.count({
    where: { clientId: user.clientId }
  });
  
  // Count finished products for this tenant
  const finishedProductsCount = await prisma.finishedProduct.count({
    where: { clientId: user.clientId }
  });
  
  // Count SKU mappings (global, not tenant-specific)
  const skuMappingsCount = await prisma.skuMapping.count();
  
  console.log(`📦 Raw Materials: ${rawMaterialsCount}`);
  console.log(`🍞 Finished Products: ${finishedProductsCount}`);
  console.log(`🏷️  SKU Mappings (global): ${skuMappingsCount}\n`);
  
  // Show sample raw materials
  if (rawMaterialsCount > 0) {
    const samples = await prisma.rawMaterial.findMany({
      where: { clientId: user.clientId },
      select: { name: true, sku: true },
      take: 5
    });
    console.log('📋 Sample Raw Materials:');
    samples.forEach(s => console.log(`   - ${s.name} (SKU: ${s.sku || 'N/A'})`));
  }
  
  if (finishedProductsCount > 0) {
    const samples = await prisma.finishedProduct.findMany({
      where: { clientId: user.clientId },
      select: { name: true, sku: true },
      take: 5
    });
    console.log('\n📋 Sample Finished Products:');
    samples.forEach(s => console.log(`   - ${s.name} (SKU: ${s.sku || 'N/A'})`));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
