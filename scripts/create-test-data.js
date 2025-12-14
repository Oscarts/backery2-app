#!/usr/bin/env node

/**
 * Create Test Customer Data
 * This script adds sample customers and orders for testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
    console.log('🔧 CREATING TEST CUSTOMER DATA');
    console.log('='.repeat(40));

    try {
        // Get the existing client
        const client = await prisma.client.findFirst();
        if (!client) {
            console.log('❌ No client found in database!');
            return;
        }

        console.log(`✅ Using client: ${client.name} (${client.id})`);

        // Create test customers
        const customers = await prisma.customer.createMany({
            data: [
                {
                    clientId: client.id,
                    name: 'John Smith',
                    email: 'john@example.com',
                    phone: '555-0123',
                    address: '123 Main St, City, State 12345',
                    isActive: true
                },
                {
                    clientId: client.id,
                    name: 'Sarah Johnson',
                    email: 'sarah@example.com',
                    phone: '555-0456',
                    address: '456 Oak Ave, City, State 12345',
                    isActive: true
                },
                {
                    clientId: client.id,
                    name: 'Mike Davis',
                    email: 'mike@example.com',
                    phone: '555-0789',
                    address: '789 Pine Rd, City, State 12345',
                    isActive: true
                }
            ]
        });

        console.log(`✅ Created ${customers.count} test customers`);

        // Get the created customers
        const createdCustomers = await prisma.customer.findMany({
            where: { clientId: client.id }
        });

        // Create test orders
        if (createdCustomers.length > 0) {
            const orders = await prisma.customerOrder.createMany({
                data: [
                    {
                        clientId: client.id,
                        customerId: createdCustomers[0].id,
                        orderNumber: 'ORD-202511-0001',
                        status: 'CONFIRMED',
                        totalPrice: 45.99,
                        expectedDeliveryDate: new Date('2024-12-15'),
                        notes: 'Birthday cake order'
                    },
                    {
                        clientId: client.id,
                        customerId: createdCustomers[1].id,
                        orderNumber: 'ORD-202511-0002',
                        status: 'DRAFT',
                        totalPrice: 23.50,
                        expectedDeliveryDate: new Date('2024-12-10'),
                        notes: 'Weekly bread order'
                    },
                    {
                        clientId: client.id,
                        customerId: createdCustomers[2].id,
                        orderNumber: 'ORD-202511-0003',
                        status: 'FULFILLED',
                        totalPrice: 67.25,
                        expectedDeliveryDate: new Date('2024-12-12'),
                        notes: 'Holiday pastries'
                    }
                ]
            });

            console.log(`✅ Created ${orders.count} test orders`);
        }

        // Verify the data
        console.log('\n📊 VERIFICATION:');
        const customerCount = await prisma.customer.count({ where: { clientId: client.id } });
        const orderCount = await prisma.customerOrder.count({ where: { clientId: client.id } });

        console.log(`   Customers: ${customerCount}`);
        console.log(`   Orders: ${orderCount}`);

        console.log('\n✅ Test data created successfully!');
        console.log('🔄 Try refreshing your frontend to see the data');

    } catch (error) {
        console.error('💥 Error creating test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createTestData();