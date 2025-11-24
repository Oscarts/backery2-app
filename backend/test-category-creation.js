const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCategoryCreation() {
    try {
        console.log('\n🧪 Testing Category Creation...\n');

        // Find a real user to get their clientId
        const testUser = await prisma.user.findFirst({
            where: {
                email: { contains: '@' }
            },
            include: {
                client: true
            }
        });

        if (!testUser) {
            console.log('❌ No user found');
            await prisma.$disconnect();
            return;
        }

        console.log(`Using user: ${testUser.email}`);
        console.log(`Client: ${testUser.client.name} (${testUser.clientId})\n`);

        // Test 1: Check existing categories
        const existingCategories = await prisma.category.findMany({
            where: { clientId: testUser.clientId },
            orderBy: { name: 'asc' }
        });

        console.log(`📁 Existing Categories (${existingCategories.length}):`);
        existingCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.type})`);
        });

        // Test 2: Try to create a new RAW_MATERIAL category
        console.log('\n🔨 Attempting to create new RAW_MATERIAL category...\n');

        const testCategoryData = {
            name: `Test Material ${Date.now()}`,
            type: 'RAW_MATERIAL',
            description: 'Test category for debugging',
            clientId: testUser.clientId
        };

        console.log('Data to create:', JSON.stringify(testCategoryData, null, 2));

        const newCategory = await prisma.category.create({
            data: testCategoryData
        });

        console.log('\n✅ Category created successfully!');
        console.log('Created category:', JSON.stringify(newCategory, null, 2));

        // Clean up - delete the test category
        await prisma.category.delete({
            where: { id: newCategory.id }
        });

        console.log('\n🧹 Test category deleted\n');

        await prisma.$disconnect();
    } catch (error) {
        console.error('\n❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

testCategoryCreation();
