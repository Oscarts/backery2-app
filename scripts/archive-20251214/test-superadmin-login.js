#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
    console.log('🔐 Testing superadmin@system.local login...\n');

    const email = 'superadmin@system.local';
    const password = 'superadmin123';

    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                client: true
            }
        });

        if (!user) {
            console.log('❌ USER NOT FOUND');
            return;
        }

        console.log('✅ User found:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Client: ${user.client.name}`);
        console.log(`   Active: ${user.isActive}`);

        // Test password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordMatch) {
            console.log('\n✅ PASSWORD CORRECT - Login would succeed!');
            console.log('\n📋 Login Credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
        } else {
            console.log('\n❌ PASSWORD INCORRECT');
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
