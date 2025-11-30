#!/usr/bin/env node

/**
 * Fix Super Admin permissions - Following CODE_GUIDELINES.md
 * 
 * Super Admin should ONLY manage:
 * - Clients (platform-level client management)
 * - Roles (role templates)
 * - Permissions (view only)
 * 
 * Super Admin should NOT have access to:
 * - Bakery operations (raw-materials, recipes, production, etc.)
 * - Customer data
 * - Dashboard, reports, etc.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSuperAdminPermissions() {
    console.log('🔧 FIXING SUPER ADMIN PERMISSIONS');
    console.log('='.repeat(60));
    console.log('Following CODE_GUIDELINES.md:');
    console.log('Super Admin manages ONLY: Clients, Roles, Role Templates');
    console.log('='.repeat(60));

    try {
        // Get System client
        const systemClient = await prisma.client.findFirst({
            where: { slug: 'system' }
        });

        if (!systemClient) {
            console.log('❌ System client not found');
            return;
        }

        console.log(`✅ Found System client: ${systemClient.name}`);

        // Get Super Admin role
        let superAdminRole = await prisma.role.findFirst({
            where: {
                name: 'Super Admin',
                clientId: systemClient.id
            },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        if (!superAdminRole) {
            console.log('⚠️  Super Admin role not found, creating it...');
            superAdminRole = await prisma.role.create({
                data: {
                    name: 'Super Admin',
                    description: 'Platform administrator - manages clients and role templates',
                    clientId: systemClient.id,
                    isSystem: true
                }
            });
        }

        console.log(`✅ Found Super Admin role (ID: ${superAdminRole.id})`);
        console.log(`   Current permissions: ${superAdminRole.permissions?.length || 0}`);

        // Define correct Super Admin permissions (ONLY 9)
        const correctPermissions = [
            // Client management (4 permissions)
            { resource: 'clients', action: 'view' },
            { resource: 'clients', action: 'create' },
            { resource: 'clients', action: 'edit' },
            { resource: 'clients', action: 'delete' },
            // Role template management (4 permissions)
            { resource: 'roles', action: 'view' },
            { resource: 'roles', action: 'create' },
            { resource: 'roles', action: 'edit' },
            { resource: 'roles', action: 'delete' },
            // Permission viewing (1 permission)
            { resource: 'permissions', action: 'view' },
        ];

        console.log(`\n📋 Setting Super Admin to have ONLY ${correctPermissions.length} permissions...`);

        // Remove ALL existing permissions
        if (superAdminRole.permissions?.length > 0) {
            await prisma.rolePermission.deleteMany({
                where: { roleId: superAdminRole.id }
            });
            console.log(`   🗑️  Removed ${superAdminRole.permissions.length} old permissions`);
        }

        // Create or find correct permissions
        const createdPermissions = [];
        for (const perm of correctPermissions) {
            let permission = await prisma.permission.findFirst({
                where: {
                    resource: perm.resource,
                    action: perm.action
                }
            });

            if (!permission) {
                permission = await prisma.permission.create({
                    data: {
                        resource: perm.resource,
                        action: perm.action,
                        description: `${perm.action} ${perm.resource}`
                    }
                });
                console.log(`   ✅ Created permission: ${perm.resource}:${perm.action}`);
            }

            createdPermissions.push(permission);
        }

        // Assign correct permissions to Super Admin role
        for (const permission of createdPermissions) {
            await prisma.rolePermission.create({
                data: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id
                }
            });
        }

        console.log(`\n✅ Super Admin role updated with ${createdPermissions.length} permissions`);

        // Verify assignment
        const updatedRole = await prisma.role.findFirst({
            where: { id: superAdminRole.id },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        console.log('\n📊 SUPER ADMIN PERMISSIONS (FINAL):');
        console.log('='.repeat(60));

        const permsByResource = {};
        updatedRole.permissions.forEach(rp => {
            const resource = rp.permission.resource;
            if (!permsByResource[resource]) {
                permsByResource[resource] = [];
            }
            permsByResource[resource].push(rp.permission.action);
        });

        Object.entries(permsByResource).forEach(([resource, actions]) => {
            console.log(`   ${resource}: ${actions.join(', ')}`);
        });

        console.log('\n✅ COMPLETE! Super Admin now has ONLY platform management permissions.');
        console.log('\n📝 What Super Admin CAN do:');
        console.log('   ✅ Manage clients (create new bakeries, edit, delete)');
        console.log('   ✅ Manage role templates (create/edit roles for new clients)');
        console.log('   ✅ View permissions (understand available permissions)');
        console.log('\n📝 What Super Admin CANNOT do:');
        console.log('   ❌ Access bakery operations (raw-materials, recipes, production)');
        console.log('   ❌ View or manage customer data');
        console.log('   ❌ Access dashboard, reports, etc.');
        console.log('\n💡 This follows SaaS best practices - platform admin vs tenant admin separation');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixSuperAdminPermissions()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
