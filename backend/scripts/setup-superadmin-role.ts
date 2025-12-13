import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupSuperAdminRole() {
    console.log('👑 Setting up Super Admin role and permissions...\n');

    try {
        // Get System client
        const systemClient = await prisma.client.findUnique({
            where: { slug: 'system' },
        });

        if (!systemClient) {
            console.error('❌ System client not found! Creating it...');
            const newSystemClient = await prisma.client.create({
                data: {
                    name: 'System',
                    email: 'system@rapidpro.local',
                    subscriptionPlan: 'ENTERPRISE',
                    slug: 'system',
                    isActive: true,
                },
            });
            console.log('✅ Created System client');
        }

        const client = systemClient || await prisma.client.findUnique({ where: { slug: 'system' } });

        if (!client) {
            throw new Error('Failed to get or create System client');
        }

        // Define Super Admin permissions (Platform management only)
        const allPermissions = [
            // Super Admin Platform Permissions Only
            // NO bakery operations - those are for bakery admins

            // Clients (Super Admin exclusive - platform management)
            { resource: 'clients', action: 'view' },
            { resource: 'clients', action: 'create' },
            { resource: 'clients', action: 'edit' },
            { resource: 'clients', action: 'delete' },

            // Users (cross-client user management)
            { resource: 'users', action: 'view' },
            { resource: 'users', action: 'create' },
            { resource: 'users', action: 'edit' },
            { resource: 'users', action: 'delete' },

            // Roles (platform-wide role management)
            { resource: 'roles', action: 'view' },
            { resource: 'roles', action: 'create' },
            { resource: 'roles', action: 'edit' },
            { resource: 'roles', action: 'delete' },

            // Permissions (view available permissions)
            { resource: 'permissions', action: 'view' },

            // Settings (platform-wide settings only)
            { resource: 'settings', action: 'view' },
            { resource: 'settings', action: 'edit' },
        ];

        // Create or get Super Admin role
        let superAdminRole = await prisma.role.findFirst({
            where: {
                name: 'Super Admin',
                clientId: client.id,
            },
        });

        if (!superAdminRole) {
            console.log('📝 Creating Super Admin role...');
            superAdminRole = await prisma.role.create({
                data: {
                    name: 'Super Admin',
                    description: 'Platform administrator - manages clients, users, and roles across the entire system',
                    clientId: client.id,
                    isSystem: true,
                },
            });
            console.log('✅ Created Super Admin role');
        } else {
            console.log('✅ Super Admin role already exists');
            // Clear existing permissions to update them
            console.log('🧹 Clearing old permissions...');
            await prisma.rolePermission.deleteMany({
                where: { roleId: superAdminRole.id }
            });
        }

        // Ensure all permissions exist in the database
        console.log('\n📝 Ensuring permissions exist...');
        for (const permDef of allPermissions) {
            let permission = await prisma.permission.findFirst({
                where: {
                    resource: permDef.resource,
                    action: permDef.action,
                },
            });

            if (!permission) {
                permission = await prisma.permission.create({
                    data: {
                        resource: permDef.resource,
                        action: permDef.action,
                        description: `${permDef.action} ${permDef.resource}`,
                    },
                });
                console.log(`   ✨ Created permission: ${permDef.resource}:${permDef.action}`);
            }

            // Link permission to Super Admin role
            const existing = await prisma.rolePermission.findFirst({
                where: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id,
                },
            });

            if (!existing) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: superAdminRole.id,
                        permissionId: permission.id,
                    },
                });
            }
        }

        console.log(`✅ Super Admin role has ${allPermissions.length} permissions\n`);

        // Update all super admin users to use this role
        console.log('👤 Updating super admin users...');
        const superAdminUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: 'superadmin' } },
                    { clientId: client.id },
                ],
            },
        });

        for (const user of superAdminUsers) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: superAdminRole.id },
            });
            console.log(`   ✅ Updated ${user.email} to use Super Admin role`);
        }

        console.log('\n✅ Super Admin setup complete!');
        console.log(`\n📋 Super Admin users can now:`);
        console.log(`   • Manage all bakery clients (create, edit, delete)`);
        console.log(`   • View and manage users across all clients`);
        console.log(`   • Create and manage roles with custom permissions`);
        console.log(`   • Configure platform-wide settings`);
        console.log(`\n⚠️  Super Admin CANNOT:`);
        console.log(`   • Manage bakery operations (raw materials, recipes, production)`);
        console.log(`   • Access client-specific inventory or orders`);
        console.log(`   • View dashboards or reports (those are for bakery admins)`);
        console.log(`\n💡 For bakery operations, assign users the "Admin" role within their client\n`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setupSuperAdminRole().catch((error) => {
    console.error(error);
    process.exit(1);
});
