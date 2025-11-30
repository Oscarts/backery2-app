#!/usr/bin/env node

/**
 * RESTORE MISSING USERS - Emergency Data Recovery
 * Recreates the users that were deleted by the database reset
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreUsers() {
    console.log('🚨 EMERGENCY USER RESTORATION');
    console.log('='.repeat(60));
    console.log('Recreating users that were lost in database reset...\n');

    try {
        // User configurations
        const usersToCreate = [
            {
                email: 'superadmin@system.local',
                password: 'superadmin123',
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMIN',
                clientName: 'System',
                clientSlug: 'system'
            },
            {
                email: 'admin@abcbakery.com',
                password: 'admin123',
                firstName: 'ABC',
                lastName: 'Admin',
                clientName: 'ABC Bakery',
                clientSlug: 'abc-bakery'
            },
            {
                email: 'admin@test.com',
                password: 'admin123',
                firstName: 'Test',
                lastName: 'Admin',
                clientName: 'Test Bakery',
                clientSlug: 'test-bakery'
            },
            {
                email: 'inventory@abcbakery.com',
                password: 'admin123',
                firstName: 'Inventory',
                lastName: 'Manager',
                clientName: 'ABC Bakery', // Same client as admin@abcbakery.com
                clientSlug: 'abc-bakery'
            }
        ];

        const createdUsers = [];
        const clientMap = new Map();

        for (const userData of usersToCreate) {
            console.log(`\n📧 Creating user: ${userData.email}`);

            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (existing) {
                console.log(`   ⚠️  User already exists, skipping...`);
                continue;
            }

            // Get or create client
            let client = clientMap.get(userData.clientSlug);

            if (!client) {
                client = await prisma.client.findFirst({
                    where: { slug: userData.clientSlug }
                });

                if (!client) {
                    console.log(`   📦 Creating client: ${userData.clientName}`);
                    client = await prisma.client.create({
                        data: {
                            name: userData.clientName,
                            email: userData.email,
                            subscriptionPlan: 'TRIAL',
                            slug: userData.clientSlug,
                            isActive: true
                        }
                    });
                    console.log(`   ✅ Client created: ${client.id}`);
                } else {
                    console.log(`   ✅ Using existing client: ${client.name}`);
                }

                clientMap.set(userData.clientSlug, client);
            } else {
                console.log(`   ✅ Using existing client: ${client.name}`);
            }

            // Hash password
            const passwordHash = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    passwordHash: passwordHash,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role || 'ADMIN',
                    clientId: client.id,
                    isActive: true
                }
            });

            console.log(`   ✅ User created successfully!`);
            createdUsers.push({ email: user.email, client: client.name });

            // Create basic data for each client if not exists
            const existingCategories = await prisma.category.count({
                where: { clientId: client.id }
            });

            if (existingCategories === 0) {
                console.log(`   📊 Creating sample data for ${client.name}...`);

                // Categories
                await prisma.category.createMany({
                    data: [
                        { name: 'Flour', type: 'RAW_MATERIAL', clientId: client.id },
                        { name: 'Sugar', type: 'RAW_MATERIAL', clientId: client.id },
                        { name: 'Dairy', type: 'RAW_MATERIAL', clientId: client.id },
                        { name: 'Breads', type: 'FINISHED_PRODUCT', clientId: client.id },
                        { name: 'Pastries', type: 'FINISHED_PRODUCT', clientId: client.id },
                        { name: 'Baking', type: 'RECIPE', clientId: client.id }
                    ]
                });

                // Supplier
                await prisma.supplier.create({
                    data: {
                        name: `${client.name} Supplier`,
                        contactInfo: { email: `supplier@${userData.clientSlug}.com`, phone: '+1-555-0100' },
                        address: '123 Supply St',
                        isActive: true,
                        clientId: client.id
                    }
                });

                // Storage Location
                await prisma.storageLocation.create({
                    data: {
                        name: 'Main Storage',
                        description: 'Primary storage area',
                        clientId: client.id
                    }
                });

                // Customers
                await prisma.customer.createMany({
                    data: [
                        {
                            clientId: client.id,
                            name: 'Sample Customer 1',
                            email: 'customer1@example.com',
                            phone: '555-1001',
                            isActive: true
                        },
                        {
                            clientId: client.id,
                            name: 'Sample Customer 2',
                            email: 'customer2@example.com',
                            phone: '555-1002',
                            isActive: true
                        }
                    ]
                });

                console.log(`   ✅ Sample data created`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ USER RESTORATION COMPLETE!');
        console.log('\n📋 Restored Users:');
        createdUsers.forEach(u => {
            console.log(`   ✅ ${u.email} (${u.client})`);
        });

        console.log('\n🔑 All users have password: admin123');
        console.log('\n⚠️  NOTE: Historical data was lost due to database reset.');
        console.log('   Only basic sample data has been created for each client.');

    } catch (error) {
        console.error('\n💥 Error restoring users:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

restoreUsers();