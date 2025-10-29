const { PrismaClient } = require('@prisma/client');

async function checkQualityStatuses() {
  const prisma = new PrismaClient();
  
  console.log('🔍 Checking Quality Statuses...\n');
  
  try {
    const qualityStatuses = await prisma.qualityStatus.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total quality statuses: ${qualityStatuses.length}`);
    
    qualityStatuses.forEach(qs => {
      console.log(`  - ${qs.name} (${qs.isActive ? 'active' : 'inactive'})`);
    });
    
    // Look for test records
    const testRecords = qualityStatuses.filter(qs => 
      qs.name.toLowerCase().includes('test') || 
      qs.name.toLowerCase().includes('crud')
    );
    
    console.log(`\nTest records found: ${testRecords.length}`);
    testRecords.forEach(tr => {
      console.log(`  - ${tr.name} (ID: ${tr.id}, active: ${tr.isActive})`);
    });
    
    // Clean up any test records
    if (testRecords.length > 0) {
      console.log('\nCleaning up test records...');
      for (const record of testRecords) {
        await prisma.qualityStatus.delete({
          where: { id: record.id }
        });
      }
      console.log('✅ Test records cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQualityStatuses();