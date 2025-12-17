const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('\n📊 Checking current database data...\n');

    // Get current user's client
    const user = await prisma.user.findFirst({
        where: { email: 'superadmin@system.local' }
    });

    if (!user) {
        console.log('❌ No user found');
        return;
    }

    console.log(`User: ${user.email} (Client ID: ${user.clientId})\n`);

    // Check categories
    const categories = await prisma.category.findMany({
        where: { clientId: user.clientId },
        orderBy: { name: 'asc' }
    });

    console.log(`📁 Categories (${categories.length}):`);
    categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type})`);
    });

    // Check suppliers
    const suppliers = await prisma.supplier.findMany({
        where: { clientId: user.clientId }
    });

    console.log(`\n🏢 Suppliers (${suppliers.length}):`);
    suppliers.forEach(sup => {
        console.log(`  - ${sup.name}`);
    });

    // Check storage locations
    const locations = await prisma.storageLocation.findMany({
        where: { clientId: user.clientId }
    });

    console.log(`\n📦 Storage Locations (${locations.length}):`);
    locations.forEach(loc => {
        console.log(`  - ${loc.name}`);
    });

    // Check quality statuses
    const statuses = await prisma.qualityStatus.findMany({
        where: { clientId: user.clientId }
    });

    console.log(`\n⭐ Quality Statuses (${statuses.length}):`);
    statuses.forEach(status => {
        console.log(`  - ${status.name}`);
    });

    await prisma.$disconnect();
}

checkData().catch(console.error);
