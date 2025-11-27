import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserPermissions() {
    try {
        console.log('🔍 Debugging user permissions...\n');

        // Find super admin user
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
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ User: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Role ID: ${user.roleId}\n`);

        if (user.customRole) {
            console.log(`📋 Role: ${user.customRole.name}`);
            console.log(`   Role ID: ${user.customRole.id}`);
            console.log(`   Total permissions: ${user.customRole.permissions.length}\n`);

            console.log('Permissions:');
            user.customRole.permissions.forEach((rp: any) => {
                const permKey = `${rp.permission.resource}:${rp.permission.action}`;
                console.log(`   ${permKey.padEnd(25)} - ${rp.permission.description}`);
            });

            // Check specifically for users permissions
            const userPerms = user.customRole.permissions.filter((rp: any) => rp.permission.resource === 'users');
            console.log(`\n🔑 User management permissions found: ${userPerms.length}`);
            userPerms.forEach((rp: any) => {
                console.log(`   ✅ users:${rp.permission.action}`);
            });

        } else {
            console.log('❌ No custom role found for this user!');
        }

        // Also check RolePermission table directly
        console.log('\n📊 Checking RolePermission table directly...');
        if (user.roleId) {
            const rolePermissions = await prisma.rolePermission.findMany({
                where: { roleId: user.roleId },
                include: {
                    permission: true,
                },
            });

            console.log(`Total RolePermissions: ${rolePermissions.length}`);
            const usersPerms = rolePermissions.filter((rp: any) => rp.permission.resource === 'users');
            console.log(`Users permissions: ${usersPerms.length}`);
            usersPerms.forEach((rp: any) => {
                console.log(`   - ${rp.permission.resource}:${rp.permission.action} (Permission ID: ${rp.permissionId})`);
            });
        } else {
            console.log('❌ User has no roleId!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugUserPermissions();
