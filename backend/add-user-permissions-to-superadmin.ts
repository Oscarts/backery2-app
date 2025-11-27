import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addUserPermissionsToSuperAdmin() {
    try {
        console.log('🔧 Adding user management permissions to Super Admin role...\n');

        // Find super admin role
        const superAdminRole = await prisma.role.findFirst({
            where: { name: 'Super Admin' },
        });

        if (!superAdminRole) {
            console.log('❌ Super Admin role not found');
            return;
        }

        console.log(`✅ Found Super Admin role: ${superAdminRole.id}\n`);

        // Find or create users permissions
        const userPermissions = [
            { resource: 'users', action: 'view', description: 'View users (Super Admin)' },
            { resource: 'users', action: 'create', description: 'Create users (Super Admin)' },
            { resource: 'users', action: 'edit', description: 'Edit users (Super Admin)' },
            { resource: 'users', action: 'delete', description: 'Delete users (Super Admin)' },
        ];

        console.log('📝 Creating/finding user permissions...');
        for (const perm of userPermissions) {
            // Find or create permission
            let permission = await prisma.permission.findFirst({
                where: {
                    resource: perm.resource,
                    action: perm.action,
                },
            });

            if (!permission) {
                permission = await prisma.permission.create({
                    data: perm,
                });
                console.log(`   ✅ Created: ${perm.resource}:${perm.action}`);
            } else {
                console.log(`   ℹ️  Found: ${perm.resource}:${perm.action}`);
            }

            // Check if role already has this permission
            const existingRolePermission = await prisma.rolePermission.findFirst({
                where: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id,
                },
            });

            if (!existingRolePermission) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: superAdminRole.id,
                        permissionId: permission.id,
                    },
                });
                console.log(`   ➕ Added to Super Admin role`);
            } else {
                console.log(`   ℹ️  Already assigned to Super Admin role`);
            }
        }

        console.log('\n🎉 Super Admin role updated successfully!');
        console.log('\n📋 Verifying permissions...');

        const updatedRole = await prisma.role.findUnique({
            where: { id: superAdminRole.id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        console.log(`\nTotal permissions: ${updatedRole?.permissions.length}`);
        updatedRole?.permissions
            .filter((rp: any) => rp.permission.resource === 'users')
            .forEach((rp: any) => {
                console.log(`   ✅ ${rp.permission.resource}:${rp.permission.action}`);
            });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addUserPermissionsToSuperAdmin();
