/**
 * Tests for Client Creation with Default Data
 * 
 * Tests the POST /api/admin/clients endpoint to ensure:
 * - Client is created successfully
 * - Admin user is created
 * - Roles are copied from system templates
 * - Default data is seeded (categories, suppliers, storage locations, quality statuses)
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Client Creation with Default Data', () => {
    let authToken: string;
    let testClientId: string;

    // Login as Super Admin before tests
    beforeAll(async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'superadmin@system.local',
                password: 'admin123',
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        authToken = loginResponse.body.data.token;
    });

    // Clean up test client after tests
    afterAll(async () => {
        if (testClientId) {
            try {
                // Delete all related data first (cascade should handle this, but being explicit)
                await prisma.user.deleteMany({ where: { clientId: testClientId } });
                await prisma.role.deleteMany({ where: { clientId: testClientId } });
                await prisma.category.deleteMany({ where: { clientId: testClientId } });
                await prisma.supplier.deleteMany({ where: { clientId: testClientId } });
                await prisma.storageLocation.deleteMany({ where: { clientId: testClientId } });
                await prisma.qualityStatus.deleteMany({ where: { clientId: testClientId } });
                await prisma.client.delete({ where: { id: testClientId } });
            } catch (error) {
                console.error('Error cleaning up test client:', error);
            }
        }
        await prisma.$disconnect();
    });

    describe('POST /api/admin/clients', () => {
        it('should create a new client with all default data', async () => {
            const newClient = {
                name: 'Test Bakery Ltd',
                slug: 'test-bakery-ltd',
                email: 'contact@testbakery.com',
                phone: '+1 555 0100',
                address: '123 Test Street, Test City',
                subscriptionPlan: 'PROFESSIONAL',
                maxUsers: 20,
                adminEmail: 'admin@testbakery.com',
                adminPassword: 'TestPassword123!',
                adminFirstName: 'Test',
                adminLastName: 'Admin',
            };

            const response = await request(app)
                .post('/api/admin/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newClient);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('client');
            expect(response.body.data).toHaveProperty('adminUser');
            expect(response.body.data).toHaveProperty('defaultData');

            // Store client ID for cleanup
            testClientId = response.body.data.client.id;

            // Verify client data
            const client = response.body.data.client;
            expect(client.name).toBe(newClient.name);
            expect(client.slug).toBe(newClient.slug);
            expect(client.email).toBe(newClient.email);
            expect(client.isActive).toBe(true);

            // Verify admin user
            const adminUser = response.body.data.adminUser;
            expect(adminUser.email).toBe(newClient.adminEmail);
            expect(adminUser.firstName).toBe(newClient.adminFirstName);
            expect(adminUser.lastName).toBe(newClient.adminLastName);

            // Verify default data counts
            const defaultData = response.body.data.defaultData;
            expect(defaultData.categories).toBeGreaterThan(0);
            expect(defaultData.suppliers).toBeGreaterThan(0);
            expect(defaultData.storageLocations).toBeGreaterThan(0);
            expect(defaultData.qualityStatuses).toBeGreaterThan(0);

            console.log('✅ Client created with default data:', {
                categories: defaultData.categories,
                suppliers: defaultData.suppliers,
                storageLocations: defaultData.storageLocations,
                qualityStatuses: defaultData.qualityStatuses,
            });
        });

        it('should have created categories for the new client', async () => {
            const categories = await prisma.category.findMany({
                where: { clientId: testClientId },
            });

            expect(categories.length).toBeGreaterThan(0);

            // Check for specific category types
            const rawMaterialCategories = categories.filter(c => c.type === 'RAW_MATERIAL');
            const finishedProductCategories = categories.filter(c => c.type === 'FINISHED_PRODUCT');
            const recipeCategories = categories.filter(c => c.type === 'RECIPE');

            expect(rawMaterialCategories.length).toBeGreaterThan(0);
            expect(finishedProductCategories.length).toBeGreaterThan(0);
            expect(recipeCategories.length).toBeGreaterThan(0);

            // Check for specific categories
            const categoryNames = categories.map(c => c.name);
            expect(categoryNames).toContain('Flours & Grains');
            expect(categoryNames).toContain('Dairy Products');
            expect(categoryNames).toContain('Breads');
            expect(categoryNames).toContain('Pastries');

            console.log(`✅ Created ${categories.length} categories:`, {
                rawMaterial: rawMaterialCategories.length,
                finishedProduct: finishedProductCategories.length,
                recipe: recipeCategories.length,
            });
        });

        it('should have created suppliers for the new client', async () => {
            const suppliers = await prisma.supplier.findMany({
                where: { clientId: testClientId },
            });

            expect(suppliers.length).toBeGreaterThan(0);
            expect(suppliers.every(s => s.isActive)).toBe(true);

            const supplierNames = suppliers.map(s => s.name);
            expect(supplierNames).toContain('General Supplier');

            console.log(`✅ Created ${suppliers.length} suppliers`);
        });

        it('should have created storage locations for the new client', async () => {
            const storageLocations = await prisma.storageLocation.findMany({
                where: { clientId: testClientId },
            });

            expect(storageLocations.length).toBeGreaterThan(0);

            const locationNames = storageLocations.map(l => l.name);
            expect(locationNames).toContain('Main Storage');
            expect(locationNames).toContain('Cold Storage');
            expect(locationNames).toContain('Freezer');

            console.log(`✅ Created ${storageLocations.length} storage locations`);
        });

        it('should have created quality statuses for the new client', async () => {
            const qualityStatuses = await prisma.qualityStatus.findMany({
                where: { clientId: testClientId },
                orderBy: { sortOrder: 'asc' },
            });

            expect(qualityStatuses.length).toBeGreaterThan(0);
            expect(qualityStatuses.every(q => q.isActive)).toBe(true);

            const statusNames = qualityStatuses.map(q => q.name);
            expect(statusNames).toContain('Excellent');
            expect(statusNames).toContain('Good');
            expect(statusNames).toContain('Damaged');

            // Verify colors are set
            qualityStatuses.forEach(status => {
                expect(status.color).toBeTruthy();
                expect(status.color).toMatch(/^#[0-9A-F]{6}$/i);
            });

            console.log(`✅ Created ${qualityStatuses.length} quality statuses`);
        });

        it('should have copied role templates to the new client', async () => {
            const roles = await prisma.role.findMany({
                where: { clientId: testClientId },
                include: {
                    permissions: true,
                },
            });

            expect(roles.length).toBeGreaterThan(0);

            const roleNames = roles.map(r => r.name);
            expect(roleNames).toContain('Admin');

            // Verify roles have permissions
            roles.forEach(role => {
                expect(role.permissions.length).toBeGreaterThan(0);
            });

            console.log(`✅ Created ${roles.length} roles with permissions`);
        });

        it('should ensure common units exist globally', async () => {
            const units = await prisma.unit.findMany();

            expect(units.length).toBeGreaterThan(0);

            const unitSymbols = units.map(u => u.symbol);
            expect(unitSymbols).toContain('kg');
            expect(unitSymbols).toContain('g');
            expect(unitSymbols).toContain('L');
            expect(unitSymbols).toContain('ml');

            console.log(`✅ Found ${units.length} global units`);
        });

        it('should reject duplicate client slug', async () => {
            const duplicateClient = {
                name: 'Another Test Bakery',
                slug: 'test-bakery-ltd', // Same slug as created client
                email: 'another@testbakery.com',
                phone: '+1 555 0200',
                address: '456 Another Street',
                adminEmail: 'admin2@testbakery.com',
                adminPassword: 'TestPassword123!',
                adminFirstName: 'Another',
                adminLastName: 'Admin',
            };

            const response = await request(app)
                .post('/api/admin/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateClient);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('should reject duplicate admin email', async () => {
            const duplicateEmailClient = {
                name: 'Unique Bakery',
                slug: 'unique-bakery',
                email: 'contact@uniquebakery.com',
                phone: '+1 555 0300',
                address: '789 Unique Avenue',
                adminEmail: 'admin@testbakery.com', // Same email as created client admin
                adminPassword: 'TestPassword123!',
                adminFirstName: 'Duplicate',
                adminLastName: 'Email',
            };

            const response = await request(app)
                .post('/api/admin/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateEmailClient);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Email already in use');
        });

        it('should reject missing required fields', async () => {
            const incompleteClient = {
                name: 'Incomplete Bakery',
                slug: 'incomplete-bakery',
                // Missing adminEmail, adminPassword, etc.
            };

            const response = await request(app)
                .post('/api/admin/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(incompleteClient);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Missing required fields');
        });
    });
});
