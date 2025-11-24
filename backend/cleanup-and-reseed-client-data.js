const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAndReseed() {
    console.log('\n🧹 Cleaning up old default data and reseeding...\n');

    // Get system client
    const systemClient = await prisma.client.findUnique({
        where: { slug: 'system' }
    });

    if (!systemClient) {
        console.log('❌ System client not found');
        return;
    }

    console.log(`System Client ID: ${systemClient.id}\n`);

    // Delete ALL old categories for system client
    const deletedCategories = await prisma.category.deleteMany({
        where: { clientId: systemClient.id }
    });

    console.log(`✅ Deleted ${deletedCategories.count} old categories`);

    // Delete ALL old suppliers for system client
    const deletedSuppliers = await prisma.supplier.deleteMany({
        where: { clientId: systemClient.id }
    });

    console.log(`✅ Deleted ${deletedSuppliers.count} old suppliers`);

    // Delete ALL old storage locations for system client
    const deletedLocations = await prisma.storageLocation.deleteMany({
        where: { clientId: systemClient.id }
    });

    console.log(`✅ Deleted ${deletedLocations.count} old storage locations`);

    // Delete ALL old quality statuses for system client
    const deletedStatuses = await prisma.qualityStatus.deleteMany({
        where: { clientId: systemClient.id }
    });

    console.log(`✅ Deleted ${deletedStatuses.count} old quality statuses`);

    // Now create new simplified data
    console.log('\n🌱 Creating new simplified default data...\n');

    // Create 4 simple categories
    const categories = [
        { name: 'Ingredient', type: 'RAW_MATERIAL', description: 'Raw materials and ingredients', clientId: systemClient.id },
        { name: 'Final Product', type: 'FINISHED_PRODUCT', description: 'Finished products ready for sale', clientId: systemClient.id },
        { name: 'Intermediate Product', type: 'FINISHED_PRODUCT', description: 'Semi-finished products used in other recipes', clientId: systemClient.id },
        { name: 'Recipe', type: 'RECIPE', description: 'Production recipes', clientId: systemClient.id }
    ];

    for (const cat of categories) {
        await prisma.category.create({ data: cat });
        console.log(`  ✅ Created category: ${cat.name}`);
    }

    // Create General Supplier
    await prisma.supplier.create({
        data: {
            name: 'General Supplier',
            contactInfo: { email: '', phone: '' },
            address: '',
            isActive: true,
            clientId: systemClient.id
        }
    });
    console.log(`  ✅ Created supplier: General Supplier`);

    // Create storage locations
    const storageLocations = [
        { name: 'Main Storage', type: 'Warehouse', description: 'Primary storage area', capacity: 'TBD', clientId: systemClient.id },
        { name: 'Cold Storage', type: 'Refrigerator', description: 'Refrigerated storage', capacity: 'TBD', clientId: systemClient.id },
        { name: 'Freezer', type: 'Freezer', description: 'Frozen storage', capacity: 'TBD', clientId: systemClient.id },
        { name: 'Dry Storage', type: 'Pantry', description: 'Dry goods storage', capacity: 'TBD', clientId: systemClient.id },
        { name: 'Production Area', type: 'Workshop', description: 'Production area', capacity: 'TBD', clientId: systemClient.id }
    ];

    for (const loc of storageLocations) {
        await prisma.storageLocation.create({ data: loc });
        console.log(`  ✅ Created storage: ${loc.name}`);
    }

    // Create quality statuses
    const qualityStatuses = [
        { name: 'Excellent', description: 'Perfect condition', color: '#4CAF50', sortOrder: 1, isActive: true, clientId: systemClient.id },
        { name: 'Good', description: 'Good condition', color: '#8BC34A', sortOrder: 2, isActive: true, clientId: systemClient.id },
        { name: 'Fair', description: 'Acceptable condition', color: '#FFEB3B', sortOrder: 3, isActive: true, clientId: systemClient.id },
        { name: 'Poor', description: 'Below standard', color: '#FF9800', sortOrder: 4, isActive: true, clientId: systemClient.id },
        { name: 'Damaged', description: 'Damaged quality', color: '#F44336', sortOrder: 5, isActive: true, clientId: systemClient.id },
        { name: 'Expired', description: 'Past expiration', color: '#9E9E9E', sortOrder: 6, isActive: true, clientId: systemClient.id }
    ];

    for (const status of qualityStatuses) {
        await prisma.qualityStatus.create({ data: status });
        console.log(`  ✅ Created quality status: ${status.name}`);
    }

    console.log('\n✅ Cleanup and reseed complete!\n');

    await prisma.$disconnect();
}

cleanupAndReseed().catch(console.error);
