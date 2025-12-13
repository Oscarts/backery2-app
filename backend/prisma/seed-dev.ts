import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Development Seed Script
 * This adds users and sample data WITHOUT deleting existing data
 * Safe to run multiple times - checks if data exists first
 */

async function main() {
    console.log('🌱 Starting safe development seed...');
    console.log('✅ This script will NOT delete any existing data\n');

    // Get or create Demo Bakery client
    let client = await prisma.client.findFirst({
        where: { email: 'admin@demobakery.com' }
    });

    if (!client) {
        console.log('🏢 Creating Demo Bakery client...');
        client = await prisma.client.create({
            data: {
                name: 'Demo Bakery',
                email: 'admin@demobakery.com',
                subscriptionPlan: 'TRIAL',
                slug: 'demo-bakery'
            }
        });
        console.log('✅ Created client:', client.name);
    } else {
        console.log('✅ Using existing client:', client.name);
    }

    // Create admin@demobakery.com if doesn't exist
    const adminEmail = 'admin@demobakery.com';
    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!adminUser) {
        console.log('👤 Creating admin@demobakery.com...');
        adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: await bcrypt.hash('admin123', 12),
                firstName: 'Demo',
                lastName: 'Admin',
                role: 'ADMIN',
                clientId: client.id,
                isActive: true
            }
        });
        console.log('✅ Created admin user');
    } else {
        console.log('✅ admin@demobakery.com already exists');
    }

    // Create admin@test.com if doesn't exist
    const testEmail = 'admin@test.com';
    let testUser = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!testUser) {
        console.log('👤 Creating admin@test.com...');
        testUser = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: await bcrypt.hash('test123', 12),
                firstName: 'Test',
                lastName: 'Admin',
                role: 'ADMIN',
                clientId: client.id,
                isActive: true
            }
        });
        console.log('✅ Created test admin user');
    } else {
        console.log('✅ admin@test.com already exists');
    }

    // Get or create System client for super admin
    let systemClient = await prisma.client.findUnique({
        where: { slug: 'system' }
    });

    if (!systemClient) {
        console.log('🏢 Creating System client...');
        systemClient = await prisma.client.create({
            data: {
                name: 'System',
                email: 'system@rapidpro.local',
                subscriptionPlan: 'ENTERPRISE',
                slug: 'system',
                isActive: true,
            }
        });
        console.log('✅ Created System client');
    } else {
        console.log('✅ System client exists');
    }

    // Create superadmin@system.local if doesn't exist
    const superEmail = 'superadmin@system.local';
    let superUser = await prisma.user.findUnique({ where: { email: superEmail } });

    if (!superUser) {
        console.log('👤 Creating superadmin@system.local...');
        superUser = await prisma.user.create({
            data: {
                email: superEmail,
                passwordHash: await bcrypt.hash('super123', 12),
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMIN',
                clientId: systemClient.id,  // Use System client
                isActive: true
            }
        });
        console.log('✅ Created super admin user in System client');
    } else {
        console.log('✅ superadmin@system.local already exists');
        // Make sure it's in the correct client
        if (superUser.clientId !== systemClient.id) {
            await prisma.user.update({
                where: { id: superUser.id },
                data: { clientId: systemClient.id }
            });
            console.log('   ⚙️  Moved to System client');
        }
        // Add some units if they don't exist
        const unitsData = [
            { name: 'Kilogram', symbol: 'kg', type: 'WEIGHT' as const, category: 'WEIGHT' },
            { name: 'Gram', symbol: 'g', type: 'WEIGHT' as const, category: 'WEIGHT' },
            { name: 'Liter', symbol: 'L', type: 'VOLUME' as const, category: 'VOLUME' },
            { name: 'Milliliter', symbol: 'ml', type: 'VOLUME' as const, category: 'VOLUME' },
            { name: 'Unit', symbol: 'un', type: 'COUNT' as const, category: 'COUNT' }
        ];

        console.log('\n📏 Checking units...');
        for (const unitData of unitsData) {
            const existing = await prisma.unit.findFirst({
                where: { symbol: unitData.symbol }
            });

            if (!existing) {
                await prisma.unit.create({
                    data: {
                        name: unitData.name,
                        symbol: unitData.symbol,
                        category: unitData.category
                    }
                });
                console.log(`✅ Created unit: ${unitData.name} (${unitData.symbol})`);
            }
        }

        // Summary
        console.log('\n═══════════════════════════════════════');
        console.log('✅ Development seed completed successfully!');
        console.log('═══════════════════════════════════════\n');
        console.log('📝 Available users:');
        console.log('   • admin@demobakery.com / admin123');
        console.log('   • admin@test.com / test123');
        console.log('   • superadmin@system.local / super123\n');
    }

    main()
        .catch((e) => {
            console.error('❌ Error seeding database:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
