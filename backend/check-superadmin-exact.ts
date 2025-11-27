import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
    try {
        console.log('🔍 Checking for super admin user...\n');

        // Check with exact email
        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
                client: true,
                customRole: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            console.log('❌ User not found with email: superadmin@system.local');
        } else {
            console.log('✅ User found:');
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Client: ${user.client.name} (${user.client.slug})`);
            console.log(`   Client Active: ${user.client.isActive}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   RoleId: ${user.roleId}`);
            if (user.customRole) {
                console.log(`   Custom Role: ${user.customRole.name}`);
                console.log(`   Permissions: ${user.customRole.permissions.length}`);
            } else {
                console.log('   Custom Role: null');
            }
            console.log(`   Password Hash exists: ${!!user.passwordHash}`);
            console.log(`   Password Hash length: ${user.passwordHash?.length || 0}`);
        }

        // Also search with toLowerCase
        const userLower = await prisma.user.findFirst({
            where: { email: { equals: 'superadmin@system.local', mode: 'insensitive' } },
        });

        if (userLower && userLower.id !== user?.id) {
            console.log('\n⚠️  Found different user with case-insensitive search:');
            console.log(`   Email in DB: ${userLower.email}`);
            console.log(`   ID: ${userLower.id}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperAdmin();
