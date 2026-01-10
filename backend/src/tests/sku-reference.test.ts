import request from 'supertest';
import app from '../app';
import { prisma } from '../app';

describe('SKU Reference API', () => {
    let authToken: string;
    let clientId: string;
    let categoryId: string;
    let storageLocationId: string;
    let skuReferenceId: string;

    beforeAll(async () => {
        // Login to get auth token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@demobakery.com',
                password: 'admin123',
            });

        authToken = loginRes.body.token;
        clientId = loginRes.body.user.clientId;

        // Get a category for testing
        const category = await prisma.category.findFirst({
            where: { clientId },
        });
        categoryId = category?.id || '';

        // Get a storage location for testing
        const storageLocation = await prisma.storageLocation.findFirst({
            where: { clientId },
        });
        storageLocationId = storageLocation?.id || '';
    });

    afterAll(async () => {
        // Cleanup - delete test SKU references
        if (skuReferenceId) {
            await prisma.skuMapping.deleteMany({
                where: { id: skuReferenceId },
            });
        }
        await prisma.$disconnect();
    });

    describe('POST /api/sku-references', () => {
        it('should create a new SKU reference with auto-generated SKU', async () => {
            const res = await request(app)
                .post('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Product',
                    description: 'Test description',
                    unitPrice: 10.5,
                    unit: 'kg',
                    reorderLevel: 5,
                    categoryId,
                    storageLocationId,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe('Test Product');
            expect(res.body.data.sku).toBe('TEST-PRODUCT');
            expect(res.body.data.unitPrice).toBe(10.5);
            expect(res.body.data.unit).toBe('kg');

            skuReferenceId = res.body.data.id;
        });

        it('should create SKU reference with custom SKU', async () => {
            const res = await request(app)
                .post('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Custom SKU Product',
                    sku: 'CUSTOM-SKU-123',
                    description: 'Test with custom SKU',
                });

            expect(res.status).toBe(201);
            expect(res.body.data.sku).toBe('CUSTOM-SKU-123');

            // Cleanup
            await prisma.skuMapping.delete({
                where: { id: res.body.data.id },
            });
        });

        it('should reject duplicate SKU for same client', async () => {
            const res = await request(app)
                .post('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Another Product',
                    sku: 'TEST-PRODUCT', // Duplicate SKU
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('already in use');
        });

        it('should reject duplicate name for same client', async () => {
            const res = await request(app)
                .post('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Product', // Duplicate name
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('already exists');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/sku-references')
                .send({ name: 'Unauthorized' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/sku-references', () => {
        it('should get all SKU references for client', async () => {
            const res = await request(app)
                .get('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data[0]).toHaveProperty('name');
            expect(res.body.data[0]).toHaveProperty('sku');
            expect(res.body.data[0]).toHaveProperty('_count');
        });

        it('should filter by search term', async () => {
            const res = await request(app)
                .get('/api/sku-references?search=Test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.every((item: any) =>
                item.name.toLowerCase().includes('test') ||
                item.sku.toLowerCase().includes('test')
            )).toBe(true);
        });

        it('should filter by category', async () => {
            if (categoryId) {
                const res = await request(app)
                    .get(`/api/sku-references?categoryId=${categoryId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.data.every((item: any) =>
                    item.categoryId === categoryId
                )).toBe(true);
            }
        });
    });

    describe('GET /api/sku-references/:id', () => {
        it('should get SKU reference by ID', async () => {
            const res = await request(app)
                .get(`/api/sku-references/${skuReferenceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(skuReferenceId);
            expect(res.body.data).toHaveProperty('category');
            expect(res.body.data).toHaveProperty('storageLocation');
            expect(res.body.data).toHaveProperty('rawMaterials');
            expect(res.body.data).toHaveProperty('finishedProducts');
        });

        it('should return 404 for non-existent ID', async () => {
            const res = await request(app)
                .get('/api/sku-references/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/sku-references/:id', () => {
        it('should update SKU reference', async () => {
            const res = await request(app)
                .put(`/api/sku-references/${skuReferenceId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Updated description',
                    unitPrice: 15.0,
                });

            expect(res.status).toBe(200);
            expect(res.body.data.description).toBe('Updated description');
            expect(res.body.data.unitPrice).toBe(15.0);
        });

        it('should prevent SKU conflicts on update', async () => {
            // Create another SKU reference
            const newItem = await request(app)
                .post('/api/sku-references')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Another Item',
                    sku: 'ANOTHER-ITEM',
                });

            // Try to update with conflicting SKU
            const res = await request(app)
                .put(`/api/sku-references/${newItem.body.data.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    sku: 'TEST-PRODUCT', // Conflict
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toContain('already in use');

            // Cleanup
            await prisma.skuMapping.delete({
                where: { id: newItem.body.data.id },
            });
        });
    });

    describe('GET /api/sku-references/:id/usage', () => {
        it('should check SKU reference usage', async () => {
            const res = await request(app)
                .get(`/api/sku-references/${skuReferenceId}/usage`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('skuReference');
            expect(res.body.data).toHaveProperty('usage');
            expect(res.body.data.usage).toHaveProperty('rawMaterials');
            expect(res.body.data.usage).toHaveProperty('finishedProducts');
            expect(res.body.data.usage).toHaveProperty('totalCount');
        });
    });

    describe('DELETE /api/sku-references/:id', () => {
        it('should prevent deletion if SKU reference is in use', async () => {
            // Create a raw material using this SKU reference
            const supplier = await prisma.supplier.findFirst({
                where: { clientId },
            });

            await prisma.rawMaterial.create({
                data: {
                    name: 'Test Raw Material',
                    sku: 'TEST-RM',
                    skuReferenceId: skuReferenceId,
                    supplierId: supplier!.id,
                    batchNumber: 'BATCH-001',
                    expirationDate: new Date('2026-12-31'),
                    quantity: 10,
                    unit: 'kg',
                    unitPrice: 5,
                    storageLocationId: storageLocationId,
                    clientId,
                },
            });

            const res = await request(app)
                .delete(`/api/sku-references/${skuReferenceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(409);
            expect(res.body.error).toContain('currently used');

            // Cleanup raw material
            await prisma.rawMaterial.deleteMany({
                where: { skuReferenceId },
            });
        });

        it('should delete unused SKU reference', async () => {
            const res = await request(app)
                .delete(`/api/sku-references/${skuReferenceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('deleted successfully');

            skuReferenceId = ''; // Prevent double cleanup
        });
    });

    describe('Multi-tenant isolation', () => {
        it('should not access other client SKU references', async () => {
            // Login as superadmin (different client)
            const superAdminRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'superadmin@system.local',
                    password: 'super123',
                });

            const superAdminToken = superAdminRes.body.token;

            const res = await request(app)
                .get('/api/sku-references')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            // Should return empty or different SKU references
            expect(res.body.data.every((item: any) =>
                item.clientId !== clientId
            )).toBe(true);
        });
    });
});
