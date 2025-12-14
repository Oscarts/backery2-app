#!/usr/bin/env node

/**
 * Create admin@test.com user
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
    console.log('🔧 CREATING admin@test.com USER');
    console.log('='.repeat(50));

    try {
        const email = 'admin@test.com';
        const password = 'admin@test.com';

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('⚠️  User already exists, updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('✅ Password updated!');
            return;
        }

        // Get or create a client
        let client = await prisma.client.findFirst();

        if (!client) {
            console.log('📦 Creating new client...');
            client = await prisma.client.create({
                data: {
                    name: 'Test Bakery',
                    subdomain: 'test',
                    isActive: true
                }
            });
            console.log(`✅ Created client: ${client.name}`);
        } else {
            console.log(`✅ Using existing client: ${client.name}`);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: 'Admin User',
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

        console.log('\n🎉 You can now log in with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('💥 Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();