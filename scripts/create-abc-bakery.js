#!/usr/bin/env node

/**
 * Create admin@abcbakery.com user with ABC Bakery client
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createABCBakeryUser() {
    console.log('🔧 CREATING admin@abcbakery.com USER');
    console.log('='.repeat(50));

    try {
        const email = 'admin@abcbakery.com';
        const password = 'admin123'; // Same as the demo user for consistency

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('⚠️  User already exists!');
            console.log(`   Email: ${existing.email}`);
            return;
        }

        // Create ABC Bakery client
        console.log('📦 Creating ABC Bakery client...');
        const client = await prisma.client.create({
            data: {
                name: 'ABC Bakery',
                email: email,
                subscriptionPlan: 'TRIAL',
                slug: 'abc-bakery'
            }
        });
        console.log(`✅ Created client: ${client.name} (${client.id})`);

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create the user
        const user = await prisma.user.create({
            data: {
                email: email,
                passwordHash: passwordHash,
                firstName: 'ABC',
                lastName: 'Admin',
                role: 'ADMIN',
                clientId: client.id,
                isActive: true
            },
            include: {
                client: true
            }
        });

        console.log('\n✅ USER CREATED SUCCESSFULLY!');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Client: ${user.client.name}`);
        console.log(`   Client ID: ${user.clientId}`);

        // Create some sample data for this client
        console.log('\n📊 Creating sample data for ABC Bakery...');

        // Create categories
        await prisma.category.createMany({
            data: [
                { name: 'Flour', type: 'RAW_MATERIAL', clientId: client.id },
                { name: 'Breads', type: 'FINISHED_PRODUCT', clientId: client.id },
                { name: 'Baking', type: 'RECIPE', clientId: client.id }
            ]
        });

        // Create a supplier
        const supplier = await prisma.supplier.create({
            data: {
                name: 'ABC Supplier Co.',
                contactInfo: { email: 'contact@abcsupplier.com', phone: '+1-555-ABC1' },
                address: '789 Supply St, Bakery Town',
                isActive: true,
                clientId: client.id
            }
        });

        // Create a storage location
        const storage = await prisma.storageLocation.create({
            data: {
                name: 'Main Storage',
                description: 'Primary storage area',
                clientId: client.id
            }
        });

        // Create customers
        await prisma.customer.createMany({
            data: [
                {
                    clientId: client.id,
                    name: 'Customer One',
                    email: 'customer1@example.com',
                    phone: '555-1001',
                    isActive: true
                },
                {
                    clientId: client.id,
                    name: 'Customer Two',
                    email: 'customer2@example.com',
                    phone: '555-1002',
                    isActive: true
                }
            ]
        });

        console.log('✅ Created sample categories, supplier, storage, and customers');

        console.log('\n🎉 Setup complete! You can now log in with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('💥 Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createABCBakeryUser();