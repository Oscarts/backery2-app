#!/usr/bin/env node

/**
 * Create Super Admin role with all permissions
 * Following CODE_GUIDELINES.md - creating missing permissions/role
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupSuperAdminRole() {
    console.log('🔧 CREATING SUPER ADMIN ROLE');
    console.log('='.repeat(60));

    try {
        // Get superadmin user
        const superadmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' }
        });

        if (!superadmin) {
            console.log('❌ Superadmin user not found');
            return;
        }

        console.log(`✅ Found superadmin: ${superadmin.email}`);
        console.log(`   Client ID: ${superadmin.clientId}`);

        // Define all resources and actions for complete access
        const allPermissions = [
            // Core features
            { resource: 'dashboard', action: 'view' },
            { resource: 'raw-materials', action: 'view' },
            { resource: 'raw-materials', action: 'create' },
            { resource: 'raw-materials', action: 'edit' },
            { resource: 'raw-materials', action: 'delete' },
            { resource: 'finished-products', action: 'view' },
            { resource: 'finished-products', action: 'create' },
            { resource: 'finished-products', action: 'edit' },
            { resource: 'finished-products', action: 'delete' },
            { resource: 'recipes', action: 'view' },
            { resource: 'recipes', action: 'create' },
            { resource: 'recipes', action: 'edit' },
            { resource: 'recipes', action: 'delete' },
            { resource: 'production', action: 'view' },
            { resource: 'production', action: 'create' },
            { resource: 'production', action: 'edit' },
            { resource: 'production', action: 'delete' },
            { resource: 'customers', action: 'view' },
            { resource: 'customers', action: 'create' },
            { resource: 'customers', action: 'edit' },
            { resource: 'customers', action: 'delete' },
            { resource: 'customer-orders', action: 'view' },
            { resource: 'customer-orders', action: 'create' },
            { resource: 'customer-orders', action: 'edit' },
            { resource: 'customer-orders', action: 'delete' },
            // Admin features
            { resource: 'users', action: 'view' },
            { resource: 'users', action: 'create' },
            { resource: 'users', action: 'edit' },
            { resource: 'users', action: 'delete' },
            { resource: 'roles', action: 'view' },
            { resource: 'roles', action: 'create' },
            { resource: 'roles', action: 'edit' },
            { resource: 'roles', action: 'delete' },
            { resource: 'clients', action: 'view' },
            { resource: 'clients', action: 'create' },
            { resource: 'clients', action: 'edit' },
            { resource: 'clients', action: 'delete' },
            { resource: 'permissions', action: 'view' },
            { resource: 'permissions', action: 'create' },
            { resource: 'permissions', action: 'edit' },
            { resource: 'permissions', action: 'delete' },
            { resource: 'settings', action: 'view' },
            { resource: 'settings', action: 'edit' },
            { resource: 'reports', action: 'view' },
            { resource: 'api-test', action: 'view' },
        ];

        console.log(`\n📋 Creating ${allPermissions.length} permissions...`);

        // Create or find permissions
        const createdPermissions = [];
        for (const perm of allPermissions) {
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
                console.log(`   ✅ Created: ${perm.resource}:${perm.action}`);
            }

            createdPermissions.push(permission);
        }

        console.log(`✅ All permissions ready (${createdPermissions.length} total)`);

        // Create Super Admin role
        console.log('\n👑 Creating Super Admin role...');
        const role = await prisma.role.create({
            data: {
                name: 'Super Admin',
                description: 'Full system access with all permissions',
                clientId: superadmin.clientId,
                isSystem: true,
                permissions: {
                    create: createdPermissions.map(perm => ({
                        permissionId: perm.id
                    }))
                }
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        console.log(`✅ Role created: ${role.name} (${role.permissions.length} permissions)`);

        // Assign role to superadmin
        console.log('\n👤 Assigning role to superadmin...');
        await prisma.user.update({
            where: { id: superadmin.id },
            data: { roleId: role.id }
        });

        console.log('✅ Role assigned successfully');

        // Verify
        const updatedUser = await prisma.user.findUnique({
            where: { id: superadmin.id },
            include: {
                customRole: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ SUPER ADMIN SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log(`\n📧 User: ${updatedUser.email}`);
        console.log(`👑 Role: ${updatedUser.customRole.name}`);
        console.log(`🔑 Permissions: ${updatedUser.customRole.permissions.length}`);

        console.log('\n📋 Permissions granted:');
        const byResource = {};
        updatedUser.customRole.permissions.forEach(rp => {
            const res = rp.permission.resource;
            if (!byResource[res]) byResource[res] = [];
            byResource[res].push(rp.permission.action);
        });

        Object.keys(byResource).sort().forEach(resource => {
            console.log(`   ${resource}: ${byResource[resource].join(', ')}`);
        });

        console.log('\n🎉 Superadmin now has full system access!');
        console.log('⚠️  You may need to log out and log back in to refresh permissions.');

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

setupSuperAdminRole();
