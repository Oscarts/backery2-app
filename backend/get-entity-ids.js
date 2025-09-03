const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getEntities() {
    try {
        console.log('🔍 Retrieving entity IDs for tests...');

        // Get categories
        const categories = await prisma.category.findMany();
        console.log('\n📦 Categories:');
        categories.forEach(cat => {
            console.log(`${cat.name} (${cat.type}): ${cat.id}`);
        });

        // Get suppliers
        const suppliers = await prisma.supplier.findMany();
        console.log('\n🏭 Suppliers:');
        suppliers.forEach(sup => {
            console.log(`${sup.name}: ${sup.id}`);
        });

        // Get storage locations
        const storageLocations = await prisma.storageLocation.findMany();
        console.log('\n📍 Storage Locations:');
        storageLocations.forEach(loc => {
            console.log(`${loc.name}: ${loc.id}`);
        });

        // Get units
        const units = await prisma.unit.findMany();
        console.log('\n📏 Units:');
        units.forEach(unit => {
            console.log(`${unit.name} (${unit.symbol}): ${unit.id}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getEntities();
