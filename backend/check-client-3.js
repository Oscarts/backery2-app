const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClient3() {
    try {
        console.log('\n📊 Checking Client 3 data...\n');

        // Find client 3
        const client3 = await prisma.client.findMany({
            take: 10,
            orderBy: { createdAt: 'asc' }
        });

        console.log('Available clients:');
        client3.forEach((c, i) => {
            console.log(`${i + 1}. ${c.name} (${c.slug}) - ID: ${c.id}`);
        });

        if (client3.length < 3) {
            console.log('\n❌ Less than 3 clients found');
            await prisma.$disconnect();
            return;
        }

        const targetClient = client3[2]; // Third client (index 2)
        console.log(`\n🎯 Checking: ${targetClient.name}\n`);

        // Categories
        const categories = await prisma.category.findMany({
            where: { clientId: targetClient.id },
            orderBy: { name: 'asc' }
        });

        console.log(`📁 Categories (${categories.length}):`);
        const catNames = {};
        categories.forEach(cat => {
            const key = `${cat.name}-${cat.type}`;
            if (catNames[key]) {
                console.log(`  ❌ DUPLICATE: ${cat.name} (${cat.type}) - ID: ${cat.id}`);
                catNames[key]++;
            } else {
                console.log(`  ✅ ${cat.name} (${cat.type}) - ID: ${cat.id}`);
                catNames[key] = 1;
            }
        });

        // Suppliers
        const suppliers = await prisma.supplier.findMany({
            where: { clientId: targetClient.id }
        });

        console.log(`\n🏢 Suppliers (${suppliers.length}):`);
        const supNames = {};
        suppliers.forEach(sup => {
            if (supNames[sup.name]) {
                console.log(`  ❌ DUPLICATE: ${sup.name} - ID: ${sup.id}`);
                supNames[sup.name]++;
            } else {
                console.log(`  ✅ ${sup.name} - ID: ${sup.id}`);
                supNames[sup.name] = 1;
            }
        });

        // Storage Locations
        const locations = await prisma.storageLocation.findMany({
            where: { clientId: targetClient.id }
        });

        console.log(`\n📦 Storage Locations (${locations.length}):`);
        const locNames = {};
        locations.forEach(loc => {
            if (locNames[loc.name]) {
                console.log(`  ❌ DUPLICATE: ${loc.name} - ID: ${loc.id}`);
                locNames[loc.name]++;
            } else {
                console.log(`  ✅ ${loc.name} - ID: ${loc.id}`);
                locNames[loc.name] = 1;
            }
        });

        // Quality Statuses
        const statuses = await prisma.qualityStatus.findMany({
            where: { clientId: targetClient.id },
            orderBy: { sortOrder: 'asc' }
        });

        console.log(`\n⭐ Quality Statuses (${statuses.length}):`);
        const statNames = {};
        statuses.forEach(stat => {
            if (statNames[stat.name]) {
                console.log(`  ❌ DUPLICATE: ${stat.name} - ID: ${stat.id}`);
                statNames[stat.name]++;
            } else {
                console.log(`  ✅ ${stat.name} - ID: ${stat.id}`);
                statNames[stat.name] = 1;
            }
        });

        console.log('\n');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkClient3();
