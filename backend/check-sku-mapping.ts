import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const name = process.argv[2] || 'Arepa';
  
  console.log(`\n🔍 Checking SKU mapping for: ${name}\n`);
  
  // Check SkuMapping table
  const mapping = await prisma.skuMapping.findUnique({
    where: { name }
  });
  
  if (mapping) {
    console.log('✅ Found in SkuMapping table:');
    console.log(`   Name: ${mapping.name}`);
    console.log(`   SKU: ${mapping.sku}`);
    console.log(`   Created: ${mapping.createdAt}`);
  } else {
    console.log('❌ NOT found in SkuMapping table');
  }
  
  // Check raw materials
  const rmCount = await prisma.rawMaterial.count({ where: { name } });
  console.log(`\n📦 Raw materials with this name: ${rmCount}`);
  
  // Check finished products
  const fpCount = await prisma.finishedProduct.count({ where: { name } });
  console.log(`🍞 Finished products with this name: ${fpCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
