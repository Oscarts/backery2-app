#!/usr/bin/env node

/**
 * Professional SaaS Role Setup
 * Creates standard roles for all clients and test data
 * Following CODE_GUIDELINES.md
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupSaaSRoles() {
    console.log('🏢 PROFESSIONAL SAAS ROLE SETUP');
    console.log('='.repeat(60));

    try {
        // Get all permissions
        const allPermissions = await prisma.permission.findMany();
        console.log(`✅ Found ${allPermissions.length} permissions in system`);

        // Define standard role templates
        const roleTemplates = {
            'Organization Admin': {
                description: 'Full access to organization resources (no client management)',
                permissions: allPermissions.filter(p =>
                    p.resource !== 'clients' // Can't manage other clients
                )
            },
            'Manager': {
                description: 'Can view, create, and edit (no delete)',
                permissions: allPermissions.filter(p =>
                    p.action !== 'delete' && p.resource !== 'clients' && p.resource !== 'users' && p.resource !== 'roles'
                )
            },
            'Staff': {
                description: 'Can view and edit assigned items',
                permissions: allPermissions.filter(p =>
                    (p.action === 'view' || p.action === 'edit') &&
                    !['clients', 'users', 'roles', 'permissions', 'settings'].includes(p.resource)
                )
            },
            'Viewer': {
                description: 'Read-only access',
                permissions: allPermissions.filter(p =>
                    p.action === 'view' && p.resource !== 'clients'
                )
            }
        };

        // Get all clients except System
        const clients = await prisma.client.findMany({
            where: {
                slug: { not: 'system' }
            },
            include: {
                users: true
            }
        });

        console.log(`\n📋 Processing ${clients.length} client(s)...\n`);

        for (const client of clients) {
            console.log(`🏢 Client: ${client.name} (${client.slug})`);
            console.log('-'.repeat(60));

            // Check existing roles
            const existingRoles = await prisma.role.findMany({
                where: { clientId: client.id }
            });

            const existingRoleNames = new Set(existingRoles.map(r => r.name));

            // Create missing standard roles
            for (const [roleName, config] of Object.entries(roleTemplates)) {
                if (existingRoleNames.has(roleName)) {
                    console.log(`   ⏭️  ${roleName} already exists`);
                    continue;
                }

                const role = await prisma.role.create({
                    data: {
                        name: roleName,
                        description: config.description,
                        clientId: client.id,
                        isSystem: false,
                        permissions: {
                            create: config.permissions.map(perm => ({
                                permissionId: perm.id
                            }))
                        }
                    }
                });

                console.log(`   ✅ Created ${roleName} (${config.permissions.length} permissions)`);
            }

            // Assign Organization Admin role to admin users without roles
            const orgAdminRole = await prisma.role.findFirst({
                where: {
                    clientId: client.id,
                    name: 'Organization Admin'
                }
            });

            const adminUsers = client.users.filter(u =>
                u.role === 'ADMIN' && !u.roleId
            );

            if (adminUsers.length > 0 && orgAdminRole) {
                for (const user of adminUsers) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { roleId: orgAdminRole.id }
                    });
                    console.log(`   👤 Assigned Organization Admin to ${user.email}`);
                }
            }

            console.log('');
        }

        // Create sample client with full data
        console.log('🆕 Checking Sample Client...');
        console.log('='.repeat(60));

        let sampleClient = await prisma.client.findFirst({
            where: { slug: 'sample-bakery' }
        });

        if (!sampleClient) {
            sampleClient = await prisma.client.create({
                data: {
                    name: 'Sample Bakery',
                    email: 'admin@samplebakery.com',
                    phone: '+1-555-0200',
                    address: '456 Sample St, Demo City, DC 12345',
                    subscriptionPlan: 'TRIAL',
                    slug: 'sample-bakery',
                    isActive: true
                }
            });
            console.log(`✅ Created client: ${sampleClient.name}`);
        } else {
            console.log(`✅ Found existing client: ${sampleClient.name}`);
        }

        // Create admin user
        let sampleAdmin = await prisma.user.findUnique({
            where: { email: 'admin@samplebakery.com' }
        });

        if (!sampleAdmin) {
            sampleAdmin = await prisma.user.create({
                data: {
                    email: 'admin@samplebakery.com',
                    passwordHash: await bcrypt.hash('admin123', 10),
                    firstName: 'Sample',
                    lastName: 'Admin',
                    role: 'ADMIN',
                    clientId: sampleClient.id,
                    isActive: true
                }
            });
            console.log(`✅ Created admin user: ${sampleAdmin.email} / admin123`);
        } else {
            console.log(`✅ Found existing admin: ${sampleAdmin.email}`);
        }

        // Create roles for sample client
        for (const [roleName, config] of Object.entries(roleTemplates)) {
            const existingRole = await prisma.role.findFirst({
                where: {
                    clientId: sampleClient.id,
                    name: roleName
                }
            });

            if (existingRole) continue;

            await prisma.role.create({
                data: {
                    name: roleName,
                    description: config.description,
                    clientId: sampleClient.id,
                    isSystem: false,
                    permissions: {
                        create: config.permissions.map(perm => ({
                            permissionId: perm.id
                        }))
                    }
                }
            });
        }

        // Assign Organization Admin role
        const sampleOrgAdminRole = await prisma.role.findFirst({
            where: {
                clientId: sampleClient.id,
                name: 'Organization Admin'
            }
        });

        if (sampleOrgAdminRole && !sampleAdmin.roleId) {
            await prisma.user.update({
                where: { id: sampleAdmin.id },
                data: { roleId: sampleOrgAdminRole.id }
            });
            console.log(`✅ Assigned Organization Admin role`);
        }

        console.log(`✅ Roles ready`);

        // Create sample data (skip if already exists)
        const existingData = await prisma.category.count({
            where: { clientId: sampleClient.id }
        });

        if (existingData > 0) {
            console.log('\n📊 Sample data already exists, skipping...');
        } else {
            console.log('\n📊 Creating sample data...');

            // Categories
            const categories = await prisma.category.createMany({
                data: [
                    { name: 'Flour & Grains', type: 'RAW_MATERIAL', clientId: sampleClient.id },
                    { name: 'Sugars & Sweeteners', type: 'RAW_MATERIAL', clientId: sampleClient.id },
                    { name: 'Dairy Products', type: 'RAW_MATERIAL', clientId: sampleClient.id },
                    { name: 'Artisan Breads', type: 'FINISHED_PRODUCT', clientId: sampleClient.id },
                    { name: 'French Pastries', type: 'FINISHED_PRODUCT', clientId: sampleClient.id },
                    { name: 'Bakery Recipes', type: 'RECIPE', clientId: sampleClient.id }
                ]
            });

            // Suppliers
            await prisma.supplier.createMany({
                data: [
                    {
                        name: 'Premium Flour Supply Co.',
                        contactInfo: { email: 'sales@premiumflour.com', phone: '+1-555-1001' },
                        address: '100 Mill Road, Grain Valley, GV 11111',
                        isActive: true,
                        clientId: sampleClient.id
                    },
                    {
                        name: 'Local Dairy Farm',
                        contactInfo: { email: 'orders@localdairy.com', phone: '+1-555-1002' },
                        address: '200 Farm Lane, Milk Town, MT 22222',
                        isActive: true,
                        clientId: sampleClient.id
                    }
                ]
            });

            // Storage locations
            await prisma.storageLocation.createMany({
                data: [
                    { name: 'Dry Goods Storage', description: 'Temperature controlled', clientId: sampleClient.id },
                    { name: 'Cold Storage', description: 'Refrigerated storage', clientId: sampleClient.id },
                    { name: 'Production Area', description: 'Active baking zone', clientId: sampleClient.id }
                ]
            });

            // Get created resources
            const flourCategory = await prisma.category.findFirst({
                where: { name: 'Flour & Grains', clientId: sampleClient.id }
            });

            const supplier = await prisma.supplier.findFirst({
                where: { clientId: sampleClient.id }
            });

            const storage = await prisma.storageLocation.findFirst({
                where: { clientId: sampleClient.id }
            });

            // Raw materials
            const today = new Date();
            const expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 6); // 6 months from now

            await prisma.rawMaterial.createMany({
                data: [
                    {
                        name: 'All-Purpose Flour',
                        sku: 'RM-FLOUR-001',
                        categoryId: flourCategory.id,
                        batchNumber: 'SUP1-20251130-001',
                        purchaseDate: today,
                        expirationDate: expirationDate,
                        quantity: 500,
                        unit: 'kg',
                        unitPrice: 2.50,
                        reorderLevel: 100,
                        supplierId: supplier.id,
                        storageLocationId: storage.id,
                        clientId: sampleClient.id
                    },
                    {
                        name: 'Bread Flour',
                        sku: 'RM-FLOUR-002',
                        categoryId: flourCategory.id,
                        batchNumber: 'SUP1-20251130-002',
                        purchaseDate: today,
                        expirationDate: expirationDate,
                        quantity: 300,
                        unit: 'kg',
                        unitPrice: 3.00,
                        reorderLevel: 75,
                        supplierId: supplier.id,
                        storageLocationId: storage.id,
                        clientId: sampleClient.id
                    }
                ]
            });

            // Customers
            await prisma.customer.createMany({
                data: [
                    {
                        name: 'Coffee Shop Downtown',
                        email: 'orders@coffeeshop.com',
                        phone: '+1-555-2001',
                        address: '789 Main St, Downtown, DT 33333',
                        isActive: true,
                        clientId: sampleClient.id
                    },
                    {
                        name: 'Restaurant Gourmet',
                        email: 'purchasing@restaurantgourmet.com',
                        phone: '+1-555-2002',
                        address: '321 Fine Dining Blvd, Uptown, UT 44444',
                        isActive: true,
                        clientId: sampleClient.id
                    }
                ]
            });

            console.log('✅ Sample data created');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ SETUP COMPLETE!');
        console.log('='.repeat(60));

        const allClients = await prisma.client.findMany({
            include: {
                users: {
                    include: {
                        customRole: true
                    }
                },
                _count: {
                    select: {
                        roles: true
                    }
                }
            }
        });

        console.log('\n📊 Summary:');
        console.log('\n🏢 Clients:');
        for (const client of allClients) {
            console.log(`\n   ${client.name} (${client.slug})`);
            console.log(`   - Roles: ${client._count.roles}`);
            console.log(`   - Users: ${client.users.length}`);
            client.users.forEach(u => {
                const roleName = u.customRole ? u.customRole.name : 'NO ROLE';
                console.log(`     • ${u.email} → ${roleName}`);
            });
        }

        console.log('\n🔑 Login Credentials:');
        console.log('   superadmin@system.local / superadmin123 (Super Admin)');
        console.log('   admin@abcbakery.com / admin123 (Organization Admin)');
        console.log('   admin@test.com / admin123 (Organization Admin)');
        console.log('   admin@samplebakery.com / admin123 (Organization Admin)');
        console.log('   inventory@abcbakery.com / admin123 (Organization Admin)');

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

setupSaaSRoles();
