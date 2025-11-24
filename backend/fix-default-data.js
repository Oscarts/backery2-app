const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDefaultData() {
    try {
        console.log('\n🔧 Fixing default data...\n');

        // Get system client
        const systemClient = await prisma.client.findUnique({
            where: { slug: 'system' }
        });

        if (!systemClient) {
            console.log('❌ System client not found');
            await prisma.$disconnect();
            return;
        }

        console.log(`Found System Client: ${systemClient.name} (${systemClient.id})\n`);

        // Step 1: Check what exists
        const existingCats = await prisma.category.count({ where: { clientId: systemClient.id } });
        const existingSups = await prisma.supplier.count({ where: { clientId: systemClient.id } });
        const existingLocs = await prisma.storageLocation.count({ where: { clientId: systemClient.id } });
        const existingStat = await prisma.qualityStatus.count({ where: { clientId: systemClient.id } });

        console.log(`Current counts:`);
        console.log(`  - Categories: ${existingCats}`);
        console.log(`  - Suppliers: ${existingSups}`);
        console.log(`  - Storage Locations: ${existingLocs}`);
        console.log(`  - Quality Statuses: ${existingStat}\n`);

        // Step 2: Delete everything for this client
        console.log('🗑️  Deleting old data...');

        await prisma.category.deleteMany({ where: { clientId: systemClient.id } });
        console.log('  ✅ Deleted categories');

        await prisma.supplier.deleteMany({ where: { clientId: systemClient.id } });
        console.log('  ✅ Deleted suppliers');

        await prisma.storageLocation.deleteMany({ where: { clientId: systemClient.id } });
        console.log('  ✅ Deleted storage locations');

        await prisma.qualityStatus.deleteMany({ where: { clientId: systemClient.id } });
        console.log('  ✅ Deleted quality statuses\n');

        // Step 3: Create new simplified data
        console.log('🌱 Creating new data...\n');

        // Categories
        await prisma.category.create({
            data: { name: 'Ingredient', type: 'RAW_MATERIAL', description: 'Raw materials and ingredients', clientId: systemClient.id }
        });
        console.log('  ✅ Ingredient');

        await prisma.category.create({
            data: { name: 'Final Product', type: 'FINISHED_PRODUCT', description: 'Finished products ready for sale', clientId: systemClient.id }
        });
        console.log('  ✅ Final Product');

        await prisma.category.create({
            data: { name: 'Intermediate Product', type: 'FINISHED_PRODUCT', description: 'Semi-finished products used in other recipes', clientId: systemClient.id }
        });
        console.log('  ✅ Intermediate Product');

        await prisma.category.create({
            data: { name: 'Recipe', type: 'RECIPE', description: 'Production recipes', clientId: systemClient.id }
        });
        console.log('  ✅ Recipe\n');

        // Supplier
        await prisma.supplier.create({
            data: {
                name: 'General Supplier',
                contactInfo: { email: '', phone: '' },
                address: '',
                isActive: true,
                clientId: systemClient.id
            }
        });
        console.log('  ✅ General Supplier\n');

        // Storage Locations
        const locations = ['Main Storage', 'Cold Storage', 'Freezer', 'Dry Storage', 'Production Area'];
        const types = ['Warehouse', 'Refrigerator', 'Freezer', 'Pantry', 'Workshop'];

        for (let i = 0; i < locations.length; i++) {
            await prisma.storageLocation.create({
                data: {
                    name: locations[i],
                    type: types[i],
                    description: `${locations[i]} area`,
                    capacity: 'TBD',
                    clientId: systemClient.id
                }
            });
            console.log(`  ✅ ${locations[i]}`);
        }
        console.log('');

        // Quality Statuses
        const statuses = [
            { name: 'Excellent', color: '#4CAF50', order: 1 },
            { name: 'Good', color: '#8BC34A', order: 2 },
            { name: 'Fair', color: '#FFEB3B', order: 3 },
            { name: 'Poor', color: '#FF9800', order: 4 },
            { name: 'Damaged', color: '#F44336', order: 5 },
            { name: 'Expired', color: '#9E9E9E', order: 6 }
        ];

        for (const status of statuses) {
            await prisma.qualityStatus.create({
                data: {
                    name: status.name,
                    description: `${status.name} condition`,
                    color: status.color,
                    sortOrder: status.order,
                    isActive: true,
                    clientId: systemClient.id
                }
            });
            console.log(`  ✅ ${status.name}`);
        }

        console.log('\n✅ Fix complete! Refresh your settings page.\n');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

fixDefaultData();
