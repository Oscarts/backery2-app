const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('🧐 Checking for duplicate entries before applying unique constraints...\n');
    
    // Check Categories for duplicates
    console.log('1. Checking Categories:');
    const categoriesRaw = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count 
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
    
    if (categories.length > 0) {
      console.log('❌ Found duplicate categories:');
      categories.forEach(cat => {
        console.log(`  - "${cat.name}": ${cat.count} entries`);
      });
    } else {
      console.log('✅ No duplicate categories found');
    }
    
    // Check Suppliers for duplicates
    console.log('\n2. Checking Suppliers:');
    const suppliersRaw = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count 
      FROM suppliers 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];
    
    if (suppliers.length > 0) {
      console.log('❌ Found duplicate suppliers:');
      suppliers.forEach(sup => {
        console.log(`  - "${sup.name}": ${sup.count} entries`);
      });
    } else {
      console.log('✅ No duplicate suppliers found');
    }
    
    // Check Storage Locations for duplicates
    console.log('\n3. Checking Storage Locations:');
    const locationsRaw = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count 
      FROM storage_locations 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `;
    const locations = Array.isArray(locationsRaw) ? locationsRaw : [];
    
    if (locations.length > 0) {
      console.log('❌ Found duplicate storage locations:');
      locations.forEach(loc => {
        console.log(`  - "${loc.name}": ${loc.count} entries`);
      });
    } else {
      console.log('✅ No duplicate storage locations found');
    }
    
    console.log('\n📊 Summary:');
    const totalDuplicates = categories.length + suppliers.length + locations.length;
    if (totalDuplicates === 0) {
      console.log('🎉 No duplicates found! Safe to apply unique constraints.');
    } else {
      console.log(`⚠️  Found ${totalDuplicates} types of duplicates. These need to be resolved first.`);
    }
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();