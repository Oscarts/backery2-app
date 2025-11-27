import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdminPermissions() {
    try {
        console.log('🔍 Checking Super Admin permissions...\n');

        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
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
            console.log('❌ Super admin not found');
            return;
        }

        console.log(`✅ User: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role ID: ${user.roleId}`);
        console.log(`   Custom Role: ${user.customRole?.name || 'N/A'}\n`);

        if (user.customRole && user.customRole.permissions.length > 0) {
            console.log('📋 Permissions:');
            user.customRole.permissions.forEach((rp: any) => {
                console.log(`   - ${rp.permission.resource}:${rp.permission.action} - ${rp.permission.description}`);
            });

            // Check specifically for users:delete
            const hasUsersDelete = user.customRole.permissions.some(
                (rp: any) => rp.permission.resource === 'users' && rp.permission.action === 'delete'
            );

            console.log(`\n🔑 Has users:delete permission: ${hasUsersDelete ? '✅ YES' : '❌ NO'}`);
        } else {
            console.log('⚠️  No permissions found!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperAdminPermissions();
