#!/usr/bin/env node

/**
 * Debug Login Issue - Check user credentials
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
    console.log('🔍 DEBUGGING LOGIN ISSUE');
    console.log('='.repeat(50));

    try {
        const email = 'admin@test.com';
        const password = 'admin@test.com';

        console.log(`\n👤 Looking for user: ${email}`);

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            console.log('❌ USER NOT FOUND IN DATABASE');
            console.log('\n📊 Available users:');
            const allUsers = await prisma.user.findMany({
                select: {
                    email: true,
                    clientId: true
                }
            });
            allUsers.forEach(u => console.log(`   - ${u.email} (clientId: ${u.clientId})`));
            return;
        }

        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Client ID: ${user.clientId}`);
        console.log(`   Client Name: ${user.client?.name || 'NO CLIENT'}`);
        console.log(`   Role ID: ${user.roleId || 'NO ROLE'}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);

        // Test password
        console.log(`\n🔐 Testing password: "${password}"`);
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            console.log('✅ PASSWORD IS CORRECT!');
            console.log('✅ Login should work');

            // Generate test token
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

            const token = jwt.sign({
                userId: user.id,
                email: user.email,
                clientId: user.clientId,
                roleId: user.roleId
            }, JWT_SECRET, { expiresIn: '7d' });

            console.log('\n🎫 Generated test token:');
            console.log(token);

        } else {
            console.log('❌ PASSWORD IS INCORRECT!');
            console.log('\n🔧 Creating new password hash for testing...');

            const newHash = await bcrypt.hash(password, 10);
            console.log(`New hash: ${newHash.substring(0, 30)}...`);

            console.log('\n💡 To fix, update the user password in database:');
            console.log(`UPDATE "User" SET password = '${newHash}' WHERE email = '${email}';`);

            // Offer to fix it
            console.log('\n🔧 Updating password in database...');
            await prisma.user.update({
                where: { email },
                data: { password: newHash }
            });
            console.log('✅ Password updated! Try logging in again.');
        }

    } catch (error) {
        console.error('💥 Debug failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLogin();