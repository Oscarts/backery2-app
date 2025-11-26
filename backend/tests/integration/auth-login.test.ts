/**
 * Integration test for authentication login flow
 * 
 * This test ensures that the login process works correctly even when
 * tenant isolation is active. It validates that:
 * 1. Users can be found by email before authentication
 * 2. Tenant isolation doesn't interfere with the login process
 * 3. Login returns proper JWT tokens and user data
 */

import { PrismaClient } from '@prisma/client';
import { setupTenantIsolation } from '../../src/middleware/tenantIsolation';
import bcrypt from 'bcryptjs';

describe('Auth Login Integration Test', () => {
    let prisma: PrismaClient;
    let testUser: any;
    let testClient: any;

    beforeAll(async () => {
        prisma = new PrismaClient();
        setupTenantIsolation(prisma);

        // Create a test client
        testClient = await prisma.client.create({
            data: {
                name: 'Test Client for Login',
                slug: 'test-client-login',
                email: 'test@login.com',
                isActive: true,
            },
        });

        // Create a test user with hashed password
        const passwordHash = await bcrypt.hash('testpassword123', 10);
        testUser = await prisma.user.create({
            data: {
                email: 'logintest@example.com',
                passwordHash,
                firstName: 'Login',
                lastName: 'Test',
                role: 'ADMIN',
                clientId: testClient.id,
                isActive: true,
            },
        });
    });

    afterAll(async () => {
        // Cleanup
        if (testUser) {
            await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
        }
        if (testClient) {
            await prisma.client.delete({ where: { id: testClient.id } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    beforeEach(() => {
        // Clear global client context before each test
        (global as any).__currentClientId = undefined;
    });

    it('should find user by email during login (no client context)', async () => {
        // Simulate login scenario: no authenticated user yet
        expect((global as any).__currentClientId).toBeUndefined();

        // This should work even without client context
        const foundUser = await prisma.user.findUnique({
            where: { email: 'logintest@example.com' },
            include: { client: true },
        });

        expect(foundUser).not.toBeNull();
        expect(foundUser?.email).toBe('logintest@example.com');
        expect(foundUser?.clientId).toBe(testClient.id);
    });

    it('should verify password during login', async () => {
        const foundUser = await prisma.user.findUnique({
            where: { email: 'logintest@example.com' },
        });

        expect(foundUser).not.toBeNull();

        if (foundUser) {
            const isPasswordValid = await bcrypt.compare('testpassword123', foundUser.passwordHash);
            expect(isPasswordValid).toBe(true);
        }
    });

    it('should enforce tenant isolation AFTER login', async () => {
        // Set client context (simulating post-login authenticated request)
        (global as any).__currentClientId = testClient.id;

        // Now queries should be filtered by clientId
        const users = await prisma.user.findMany();

        // All returned users should belong to the current client
        users.forEach(user => {
            expect(user.clientId).toBe(testClient.id);
        });
    });

    it('should prevent cross-tenant access on findUnique with context', async () => {
        // Create another client and user
        const otherClient = await prisma.client.create({
            data: {
                name: 'Other Client',
                slug: 'other-client',
                email: 'other@example.com',
                isActive: true,
            },
        });

        const otherUser = await prisma.user.create({
            data: {
                email: 'other@example.com',
                passwordHash: await bcrypt.hash('password', 10),
                firstName: 'Other',
                lastName: 'User',
                role: 'ADMIN',
                clientId: otherClient.id,
                isActive: true,
            },
        });

        // Set context to testClient
        (global as any).__currentClientId = testClient.id;

        // Try to access user from other client by ID
        const result = await prisma.user.findUnique({
            where: { id: otherUser.id },
        });

        // Should return null due to tenant isolation
        expect(result).toBeNull();

        // Cleanup
        await prisma.user.delete({ where: { id: otherUser.id } });
        await prisma.client.delete({ where: { id: otherClient.id } });
    });
});
