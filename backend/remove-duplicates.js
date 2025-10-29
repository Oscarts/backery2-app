const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
  try {
    console.log('🧹 Removing duplicate entries to enable unique constraints...\n');
    
    // Remove duplicate categories (keep the oldest one)
    console.log('1. Cleaning up duplicate categories...');
    const categoryDuplicates = await prisma.$queryRaw`
      SELECT name, array_agg(id ORDER BY "createdAt" ASC) as ids 
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    
    for (const cat of categoryDuplicates) {
      const [keepId, ...deleteIds] = cat.ids;
      console.log(`  - Keeping "${cat.name}" (${keepId}), removing ${deleteIds.length} duplicates`);
      
      // Delete the duplicate entries
      await prisma.category.deleteMany({
        where: {
          id: { in: deleteIds }
        }
      });
    }
    
    // Remove duplicate suppliers (keep the oldest one)
    console.log('\n2. Cleaning up duplicate suppliers...');
    const supplierDuplicates = await prisma.$queryRaw`
      SELECT name, array_agg(id ORDER BY "createdAt" ASC) as ids 
      FROM suppliers 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    
    for (const sup of supplierDuplicates) {
      const [keepId, ...deleteIds] = sup.ids;
      console.log(`  - Keeping "${sup.name}" (${keepId}), removing ${deleteIds.length} duplicates`);
      
      // First, update any raw materials that reference the duplicate suppliers
      // to point to the one we're keeping
      for (const deleteId of deleteIds) {
        await prisma.rawMaterial.updateMany({
          where: { supplierId: deleteId },
          data: { supplierId: keepId }
        });
      }
      
      // Then delete the duplicate entries
      await prisma.supplier.deleteMany({
        where: {
          id: { in: deleteIds }
        }
      });
    }
    
    // Remove duplicate storage locations (keep the oldest one)
    console.log('\n3. Cleaning up duplicate storage locations...');
    const locationDuplicates = await prisma.$queryRaw`
      SELECT name, array_agg(id ORDER BY "createdAt" ASC) as ids 
      FROM storage_locations 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    
    for (const loc of locationDuplicates) {
      const [keepId, ...deleteIds] = loc.ids;
      console.log(`  - Keeping "${loc.name}" (${keepId}), removing ${deleteIds.length} duplicates`);
      
      // First, update any materials that reference the duplicate locations
      // to point to the one we're keeping
      for (const deleteId of deleteIds) {
        await prisma.rawMaterial.updateMany({
          where: { storageLocationId: deleteId },
          data: { storageLocationId: keepId }
        });
        
        await prisma.finishedProduct.updateMany({
          where: { storageLocationId: deleteId },
          data: { storageLocationId: keepId }
        });
      }
      
      // Then delete the duplicate entries
      await prisma.storageLocation.deleteMany({
        where: {
          id: { in: deleteIds }
        }
      });
    }
    
    console.log('\n✅ All duplicates removed successfully!');
    console.log('🎯 Now safe to apply unique constraints.');
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates();