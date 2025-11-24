/**
 * Integration tests for Settings endpoints
 * Tests that all Settings page creation endpoints properly handle clientId isolation
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Settings Endpoints - Multi-Tenant Isolation', () => {
    let authToken: string;
    let testClientId: string;
    let createdCategoryId: string;
    let createdSupplierId: string;
    let createdStorageLocationId: string;
    let createdQualityStatusId: string;

    beforeAll(async () => {
        // Login as regular user
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'superadmin@system.local',
                password: 'admin123',
            });

        expect(loginResponse.status).toBe(200);
        authToken = loginResponse.body.data.token;

        // Get user's clientId
        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' }
        });
        testClientId = user!.clientId;
    });

    afterAll(async () => {
        // Cleanup created test data
        if (createdCategoryId) {
            await prisma.category.deleteMany({
                where: { name: { startsWith: 'Test Category' } }
            }).catch(() => { });
        }
        if (createdSupplierId) {
            await prisma.supplier.deleteMany({
                where: { name: { startsWith: 'Test Supplier' } }
            }).catch(() => { });
        }
        if (createdStorageLocationId) {
            await prisma.storageLocation.deleteMany({
                where: { name: { startsWith: 'Test Storage' } }
            }).catch(() => { });
        }
        if (createdQualityStatusId) {
            await prisma.qualityStatus.deleteMany({
                where: { name: { startsWith: 'Test Quality' } }
            }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('POST /api/categories', () => {
        it('should create category with correct clientId', async () => {
            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Category ${Date.now()}`,
                    type: 'RAW_MATERIAL',
                    description: 'Test description'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('clientId');
            expect(response.body.data.clientId).toBe(testClientId);
            expect(response.body.data.name).toContain('Test Category');
            expect(response.body.data.type).toBe('RAW_MATERIAL');

            createdCategoryId = response.body.data.id;
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/categories')
                .send({
                    name: 'Unauthorized Category',
                    type: 'RAW_MATERIAL'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/suppliers', () => {
        it('should create supplier with correct clientId', async () => {
            const response = await request(app)
                .post('/api/suppliers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Supplier ${Date.now()}`,
                    contactInfo: { email: 'test@supplier.com', phone: '123-456-7890' },
                    address: 'Test Address',
                    isActive: true
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('clientId');
            expect(response.body.data.clientId).toBe(testClientId);
            expect(response.body.data.name).toContain('Test Supplier');

            createdSupplierId = response.body.data.id;
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/suppliers')
                .send({
                    name: 'Unauthorized Supplier'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/storage-locations', () => {
        it('should create storage location with correct clientId', async () => {
            const response = await request(app)
                .post('/api/storage-locations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Storage ${Date.now()}`,
                    type: 'Warehouse',
                    description: 'Test storage location',
                    capacity: '1000'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('clientId');
            expect(response.body.data.clientId).toBe(testClientId);
            expect(response.body.data.name).toContain('Test Storage');

            createdStorageLocationId = response.body.data.id;
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/storage-locations')
                .send({
                    name: 'Unauthorized Storage',
                    type: 'Warehouse'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/quality-statuses', () => {
        it('should create quality status with correct clientId', async () => {
            const response = await request(app)
                .post('/api/quality-statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Quality ${Date.now()}`,
                    description: 'Test quality status',
                    color: '#FF5733',
                    sortOrder: 99
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('clientId');
            expect(response.body.data.clientId).toBe(testClientId);
            expect(response.body.data.name).toContain('Test Quality');
            expect(response.body.data.color).toBe('#FF5733');

            createdQualityStatusId = response.body.data.id;
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/quality-statuses')
                .send({
                    name: 'Unauthorized Quality',
                    color: '#000000'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Multi-Tenant Isolation Verification', () => {
        it('should only return data for authenticated user clientId', async () => {
            // Create a category
            await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Isolation Test ${Date.now()}`,
                    type: 'FINISHED_PRODUCT',
                    description: 'Isolation test'
                });

            // Fetch all categories
            const response = await request(app)
                .get('/api/categories')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);

            // Verify all returned categories belong to the user's client
            response.body.data.forEach((category: any) => {
                expect(category.clientId).toBe(testClientId);
            });
        });

        it('should verify all Settings endpoints properly set clientId', async () => {
            // This test verifies that clientId is never undefined or null
            const endpoints = [
                { path: '/api/categories', data: { name: `Verify Cat ${Date.now()}`, type: 'RAW_MATERIAL' } },
                { path: '/api/suppliers', data: { name: `Verify Sup ${Date.now()}` } },
                { path: '/api/storage-locations', data: { name: `Verify Stor ${Date.now()}`, type: 'Warehouse' } },
                { path: '/api/quality-statuses', data: { name: `Verify Qual ${Date.now()}`, color: '#123456', sortOrder: 1 } }
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .post(endpoint.path)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(endpoint.data);

                expect(response.status).toBe(201);
                expect(response.body.data.clientId).toBeDefined();
                expect(response.body.data.clientId).not.toBeNull();
                expect(response.body.data.clientId).toBe(testClientId);
            }
        });
    });
});
