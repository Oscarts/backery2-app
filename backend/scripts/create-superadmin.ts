import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
    console.log('🚀 Creating Super Admin...\n');

    // Create system client if not exists
    let systemClient = await prisma.client.findFirst({ where: { slug: 'system' } });

    if (!systemClient) {
        systemClient = await prisma.client.create({
            data: {
                name: 'System',
                slug: 'system',
                isActive: true
            }
        });
        console.log('✅ Created system client');
    } else {
        console.log('ℹ️  System client already exists');
    }

    // Create Super Admin user (ADMIN role in "system" client = Super Admin)
    const password = 'SuperAdmin2025!';
    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
        where: { email: 'superadmin@rapidpro.app' }
    });

    if (existingUser) {
        console.log('⚠️  Super Admin user already exists');
    } else {
        await prisma.user.create({
            data: {
                email: 'superadmin@rapidpro.app',
                passwordHash,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMIN',  // ADMIN in system client = Super Admin
                clientId: systemClient.id,
                isActive: true
            }
        });
        console.log('✅ Created Super Admin user');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🔐 SUPER ADMIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log('   Email:    superadmin@rapidpro.app');
    console.log('   Password: ' + password);
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

    await prisma.$disconnect();
}

createSuperAdmin().catch(console.error);

createSuperAdmin().catch(console.error);
