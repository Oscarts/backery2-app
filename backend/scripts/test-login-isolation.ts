#!/usr/bin/env tsx
/**
 * Quick verification script to ensure login works with tenant isolation
 * Run with: npm run test:login-isolation
 */

import { PrismaClient } from '@prisma/client';
import { setupTenantIsolation } from '../src/middleware/tenantIsolation';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLoginIsolation() {
    console.log('\n🧪 Testing Login with Tenant Isolation\n');
    console.log('='.repeat(60));

    // Setup tenant isolation
    setupTenantIsolation(prisma);

    try {
        // Test 1: Login scenario (no client context)
        console.log('\n✅ Test 1: Finding user WITHOUT client context (login scenario)');
        (global as any).__currentClientId = undefined;

        const loginUser = await prisma.user.findUnique({
            where: { email: 'admin@abcbakery.com' },
            include: { client: true },
        });

        if (loginUser) {
            console.log('   ✓ User found:', loginUser.email);
            console.log('   ✓ Client:', loginUser.client.name);
            console.log('   ✓ User ID:', loginUser.id);

            // Test password validation
            const isPasswordValid = await bcrypt.compare('password123', loginUser.passwordHash);
            console.log('   ✓ Password validation:', isPasswordValid ? 'PASS' : 'FAIL');
        } else {
            console.log('   ✗ FAILED: User not found during login simulation');
            process.exit(1);
        }

        // Test 2: Authenticated scenario (with client context)
        console.log('\n✅ Test 2: Queries WITH client context (authenticated scenario)');
        (global as any).__currentClientId = loginUser!.clientId;

        const authenticatedUsers = await prisma.user.findMany({
            take: 5,
        });

        console.log(`   ✓ Found ${authenticatedUsers.length} users with tenant isolation`);
        authenticatedUsers.forEach(u => {
            console.log(`   ✓ User: ${u.email} - ClientId: ${u.clientId}`);
            if (u.clientId !== loginUser!.clientId) {
                console.log('   ✗ FAILED: Cross-tenant data leak detected!');
                process.exit(1);
            }
        });

        // Test 3: Verify isolation blocks cross-tenant access
        console.log('\n✅ Test 3: Verifying cross-tenant access is blocked');
        const allUsersWithoutContext = await prisma.$queryRaw`SELECT email, "clientId" FROM users LIMIT 5`;
        console.log('   ✓ Total users in DB (raw query):', (allUsersWithoutContext as any[]).length);

        const usersWithIsolation = await prisma.user.findMany({ take: 100 });
        const uniqueClients = new Set(usersWithIsolation.map(u => u.clientId));

        if (uniqueClients.size === 1 && uniqueClients.has(loginUser!.clientId)) {
            console.log('   ✓ Tenant isolation working: Only seeing current tenant data');
        } else {
            console.log('   ✗ FAILED: Tenant isolation not working properly');
            console.log('   ✗ Unique client IDs found:', Array.from(uniqueClients));
            process.exit(1);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests PASSED! Login works correctly with tenant isolation.');
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test FAILED with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testLoginIsolation();
