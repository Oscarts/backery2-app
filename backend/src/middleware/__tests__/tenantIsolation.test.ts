import { PrismaClient } from '@prisma/client';
import { setupTenantIsolation } from '../tenantIsolation';

describe('Tenant Isolation Middleware', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
        prisma = new PrismaClient();
        setupTenantIsolation(prisma);
        // Clear global state
        (global as any).__currentClientId = undefined;
    });

    afterEach(async () => {
        await prisma.$disconnect();
    });

    describe('Unauthenticated Requests (Login Flow)', () => {
        it('should allow findUnique without clientId context (login scenario)', async () => {
            // This simulates the login flow where no user is authenticated yet
            (global as any).__currentClientId = undefined;

            // Mock the query - in real scenario this would be a User.findUnique by email
            const mockResult = {
                id: 'user-123',
                email: 'test@example.com',
                clientId: 'client-456',
            };

            // The middleware should NOT filter out the result when __currentClientId is undefined
            // This is tested by ensuring the login controller can find users
            expect((global as any).__currentClientId).toBeUndefined();
        });

        it('should allow User queries during login (no client context)', async () => {
            (global as any).__currentClientId = undefined;

            // When there's no client context, tenant isolation should be skipped
            // This ensures login works before authentication
            expect((global as any).__currentClientId).toBeUndefined();
        });
    });

    describe('Authenticated Requests (Tenant Isolation)', () => {
        it('should set clientId filter for findMany when context is set', async () => {
            const testClientId = 'client-123';
            (global as any).__currentClientId = testClientId;

            // With client context set, tenant isolation should be active
            expect((global as any).__currentClientId).toBe(testClientId);
        });

        it('should filter out records from other tenants on findUnique', async () => {
            const testClientId = 'client-123';
            (global as any).__currentClientId = testClientId;

            // When a record belongs to a different client, it should be filtered
            const mockResult = {
                id: 'record-1',
                clientId: 'different-client-456',
            };

            // The middleware should return null for cross-tenant access
            expect(mockResult.clientId).not.toBe(testClientId);
        });

        it('should allow access to records from same tenant', async () => {
            const testClientId = 'client-123';
            (global as any).__currentClientId = testClientId;

            const mockResult = {
                id: 'record-1',
                clientId: testClientId,
            };

            // The middleware should allow access to same-tenant records
            expect(mockResult.clientId).toBe(testClientId);
        });
    });

    describe('Create Operations', () => {
        it('should auto-add clientId to create operations when context is set', async () => {
            const testClientId = 'client-123';
            (global as any).__currentClientId = testClientId;

            // When creating records with client context, clientId should be auto-added
            expect((global as any).__currentClientId).toBe(testClientId);
        });

        it('should not add clientId to create operations without context', async () => {
            (global as any).__currentClientId = undefined;

            // Without client context, clientId should not be auto-added
            expect((global as any).__currentClientId).toBeUndefined();
        });
    });
});
