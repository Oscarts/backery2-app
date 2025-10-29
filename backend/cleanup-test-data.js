const { PrismaClient } = require('@prisma/client');

async function cleanupTestUnits() {
  const prisma = new PrismaClient();
  
  console.log('🧹 Cleaning up test units...\n');
  
  try {
    // Delete any test units
    const testPatterns = [
      'Test Unit CRUD',
      'Test Category CRUD',
      'Test Supplier CRUD', 
      'Test Storage CRUD',
      'Test Quality CRUD'
    ];
    
    for (const pattern of testPatterns) {
      // For units, delete the record entirely
      const deletedUnits = await prisma.unit.deleteMany({
        where: {
          name: pattern
        }
      });
      
      if (deletedUnits.count > 0) {
        console.log(`✅ Deleted ${deletedUnits.count} test unit(s) with name "${pattern}"`);
      }
      
      // For categories
      const deletedCategories = await prisma.category.deleteMany({
        where: {
          name: pattern
        }
      });
      
      if (deletedCategories.count > 0) {
        console.log(`✅ Deleted ${deletedCategories.count} test categor(ies) with name "${pattern}"`);
      }
      
      // For suppliers
      const deletedSuppliers = await prisma.supplier.deleteMany({
        where: {
          name: pattern
        }
      });
      
      if (deletedSuppliers.count > 0) {
        console.log(`✅ Deleted ${deletedSuppliers.count} test supplier(s) with name "${pattern}"`);
      }
      
      // For storage locations
      const deletedLocations = await prisma.storageLocation.deleteMany({
        where: {
          name: pattern
        }
      });
      
      if (deletedLocations.count > 0) {
        console.log(`✅ Deleted ${deletedLocations.count} test storage location(s) with name "${pattern}"`);
      }
      
      // For quality statuses
      const deletedStatuses = await prisma.qualityStatus.deleteMany({
        where: {
          name: pattern
        }
      });
      
      if (deletedStatuses.count > 0) {
        console.log(`✅ Deleted ${deletedStatuses.count} test quality status(es) with name "${pattern}"`);
      }
    }
    
    console.log('\n✨ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUnits();