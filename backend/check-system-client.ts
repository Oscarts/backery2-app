import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSystemClient() {
    try {
        console.log('🔍 Checking System client...\n');

        const systemClient = await prisma.client.findFirst({
            where: { slug: 'system' },
        });

        if (systemClient) {
            console.log('✅ System client found:');
            console.log(`   ID: ${systemClient.id}`);
            console.log(`   Name: ${systemClient.name}`);
            console.log(`   Slug: ${systemClient.slug}\n`);
        } else {
            console.log('❌ System client not found\n');
        }

        // Check super admin user
        const superAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
                client: true,
            },
        });

        if (superAdmin) {
            console.log('✅ Super admin user:');
            console.log(`   Client ID: ${superAdmin.clientId}`);
            console.log(`   Client Name: ${superAdmin.client.name}`);
            console.log(`   Client Slug: ${superAdmin.client.slug}`);
            console.log(`\n   Is in System client: ${superAdmin.client.slug === 'system' ? '✅ YES' : '❌ NO'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSystemClient();
