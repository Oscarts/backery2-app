import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔄 Backfilling SKU mappings from existing products...\n');
  
  // Get all raw materials with SKUs
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: { sku: { not: null } },
    select: { name: true, sku: true, category: { select: { name: true } } },
    distinct: ['name'],
  });
  
  console.log(`📦 Found ${rawMaterials.length} unique raw material names with SKUs`);
  
  // Get all finished products with SKUs
  const finishedProducts = await prisma.finishedProduct.findMany({
    where: { sku: { not: '' } },
    select: { name: true, sku: true, category: { select: { name: true } } },
    distinct: ['name'],
  });
  
  console.log(`🍞 Found ${finishedProducts.length} unique finished product names with SKUs\n`);
  
  // Create mappings for all products
  const allProducts = [
    ...rawMaterials.map(rm => ({ 
      name: rm.name, 
      sku: rm.sku!, 
      category: rm.category?.name 
    })),
    ...finishedProducts.map(fp => ({ 
      name: fp.name, 
      sku: fp.sku, 
      category: fp.category?.name 
    }))
  ];
  
  // Deduplicate by name (priority to finished products)
  const uniqueByName = new Map<string, { name: string; sku: string; category?: string }>();
  allProducts.forEach(product => {
    if (!uniqueByName.has(product.name)) {
      uniqueByName.set(product.name, product);
    }
  });
  
  console.log(`Creating ${uniqueByName.size} SKU mappings...\n`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const [name, product] of uniqueByName) {
    try {
      const existing = await prisma.skuMapping.findUnique({
        where: { name }
      });
      
      if (existing) {
        if (existing.sku !== product.sku) {
          await prisma.skuMapping.update({
            where: { name },
            data: { sku: product.sku, category: product.category || null }
          });
          console.log(`  ✏️  Updated: ${name} -> ${product.sku}`);
          updated++;
        } else {
          skipped++;
        }
      } else {
        await prisma.skuMapping.create({
          data: {
            name,
            sku: product.sku,
            category: product.category || null
          }
        });
        console.log(`  ✅ Created: ${name} -> ${product.sku}`);
        created++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error for ${name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${uniqueByName.size}\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
