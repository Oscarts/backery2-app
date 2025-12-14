#!/usr/bin/env node

/**
 * Verify login functionality for superadmin and admin@test.com
 * Following CODE_GUIDELINES.md - checking current state first
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyUserLogins() {
    console.log('🔍 VERIFYING USER ACCOUNTS');
    console.log('='.repeat(60));
    console.log('Following CODE_GUIDELINES.md - checking current state\n');

    const testUsers = [
        { email: 'superadmin@system.local', password: 'superadmin123' },
        { email: 'admin@test.com', password: 'admin123' }
    ];

    const results = [];

    for (const testUser of testUsers) {
        console.log(`\n📧 Testing: ${testUser.email}`);
        console.log('-'.repeat(60));

        try {
            // 1. Check if user exists
            const user = await prisma.user.findUnique({
                where: { email: testUser.email },
                include: {
                    client: true
                }
            });

            if (!user) {
                console.log('❌ USER NOT FOUND');
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'User does not exist in database'
                });
                continue;
            }

            console.log('✅ User found in database');
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Client: ${user.client.name} (${user.client.id})`);
            console.log(`   Active: ${user.isActive}`);

            // 2. Verify user is active
            if (!user.isActive) {
                console.log('❌ USER IS INACTIVE');
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'User account is not active'
                });
                continue;
            }

            console.log('✅ User account is active');

            // 3. Verify client exists and is active
            if (!user.client) {
                console.log('❌ CLIENT NOT FOUND');
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'Client does not exist'
                });
                continue;
            }

            console.log('✅ Client exists');

            if (!user.client.isActive) {
                console.log('❌ CLIENT IS INACTIVE');
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'Client account is not active'
                });
                continue;
            }

            console.log('✅ Client is active');

            // 4. Verify password hash exists
            if (!user.passwordHash) {
                console.log('❌ NO PASSWORD HASH');
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'Password hash is missing'
                });
                continue;
            }

            console.log('✅ Password hash exists');

            // 5. Test password verification
            const passwordMatch = await bcrypt.compare(testUser.password, user.passwordHash);

            if (!passwordMatch) {
                console.log('❌ PASSWORD DOES NOT MATCH');
                console.log(`   Expected password: ${testUser.password}`);
                results.push({
                    email: testUser.email,
                    status: 'FAILED',
                    reason: 'Password does not match hash'
                });
                continue;
            }

            console.log('✅ Password verified successfully');

            // 6. Check data access (verify clientId filtering works)
            const dataCheck = await prisma.category.count({
                where: { clientId: user.clientId }
            });

            console.log(`✅ User has access to ${dataCheck} categories`);

            // All checks passed
            console.log('\n🎉 ALL CHECKS PASSED - LOGIN WILL WORK');
            results.push({
                email: testUser.email,
                status: 'SUCCESS',
                clientId: user.clientId,
                clientName: user.client.name,
                role: user.role,
                dataCount: dataCheck
            });

        } catch (error) {
            console.log('💥 ERROR:', error.message);
            results.push({
                email: testUser.email,
                status: 'ERROR',
                reason: error.message
            });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status !== 'SUCCESS');

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    successful.forEach(r => {
        console.log(`   ✓ ${r.email}`);
        console.log(`     Client: ${r.clientName}`);
        console.log(`     Role: ${r.role}`);
        console.log(`     Categories: ${r.dataCount}`);
    });

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
        failed.forEach(r => {
            console.log(`   ✗ ${r.email}`);
            console.log(`     Reason: ${r.reason}`);
        });
    }

    console.log('\n🔑 Login Credentials:');
    console.log('   superadmin@system.local / superadmin123');
    console.log('   admin@test.com / admin123');

    if (successful.length === results.length) {
        console.log('\n✅ ALL ACCOUNTS VERIFIED - READY TO USE');
    } else {
        console.log('\n⚠️  SOME ACCOUNTS HAVE ISSUES - SEE DETAILS ABOVE');
    }
}

verifyUserLogins()
    .catch(error => {
        console.error('💥 Fatal error:', error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
