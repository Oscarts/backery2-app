import request from 'supertest';
import createApp from '../app';
import { prisma } from '../app';

const app = createApp();

// Set timeout for all tests in this file
jest.setTimeout(30000);

describe('Production Run Custom Steps API', () => {
    let authToken: string;

    beforeAll(async () => {
        // Login to get auth token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@demobakery.com',
                password: 'admin123',
            })
            .timeout(10000);

        if (!loginRes.body.data?.token) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
        }

        authToken = loginRes.body.data.token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/production/runs with custom steps', () => {
        test('should create production run with custom steps', async () => {
            // First, get a recipe to use for testing
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const recipes = recipesResponse.body.data;
            if (recipes.length === 0) {
                console.log('No recipes available for testing');
                return;
            }

            const testRecipe = recipes[0];
            const customSteps = [
                {
                    name: 'Custom Prep',
                    description: 'Custom preparation step',
                    stepOrder: 1,
                    estimatedMinutes: 20
                },
                {
                    name: 'Custom Production',
                    description: 'Custom production step',
                    stepOrder: 2,
                    estimatedMinutes: 45
                },
                {
                    name: 'Custom Quality',
                    description: 'Custom quality check step',
                    stepOrder: 3,
                    estimatedMinutes: 10
                }
            ];

            const productionData = {
                name: 'Test Production with Custom Steps',
                recipeId: testRecipe.id,
                targetQuantity: 10,
                targetUnit: 'pieces',
                notes: 'Test production run',
                customSteps: customSteps
            };

            const response = await request(app)
                .post('/api/production/runs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productionData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');

            const productionRun = response.body.data;
            expect(productionRun).toHaveProperty('id');
            expect(productionRun).toHaveProperty('name', productionData.name);
            expect(productionRun).toHaveProperty('recipeId', testRecipe.id);
            expect(productionRun).toHaveProperty('targetQuantity', 10);
            expect(productionRun).toHaveProperty('steps');

            // Verify custom steps were created
            expect(productionRun.steps).toHaveLength(3);
            expect(productionRun.steps[0]).toHaveProperty('name', 'Custom Prep');
            expect(productionRun.steps[0]).toHaveProperty('description', 'Custom preparation step');
            expect(productionRun.steps[0]).toHaveProperty('estimatedMinutes', 20);
            expect(productionRun.steps[0]).toHaveProperty('stepOrder', 1);

            expect(productionRun.steps[1]).toHaveProperty('name', 'Custom Production');
            expect(productionRun.steps[2]).toHaveProperty('name', 'Custom Quality');
        });

        test('should create production run with default steps when no custom steps provided', async () => {
            // Get a recipe to use for testing
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const recipes = recipesResponse.body.data;
            if (recipes.length === 0) {
                console.log('No recipes available for testing');
                return;
            }

            const testRecipe = recipes[0];
            const productionData = {
                name: 'Test Production with Default Steps',
                recipeId: testRecipe.id,
                targetQuantity: 5,
                targetUnit: 'pieces',
                notes: 'Test production run with defaults'
                // No customSteps provided
            };

            const response = await request(app)
                .post('/api/production/runs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productionData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            const productionRun = response.body.data;

            // Should have default steps
            expect(productionRun.steps).toHaveLength(4);
            expect(productionRun.steps[0]).toHaveProperty('name', 'Preparation');
            expect(productionRun.steps[1]).toHaveProperty('name', 'Production');
            expect(productionRun.steps[2]).toHaveProperty('name', 'Quality Check');
            expect(productionRun.steps[3]).toHaveProperty('name', 'Packaging');
        });

        test('should handle invalid custom steps gracefully', async () => {
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const recipes = recipesResponse.body.data;
            if (recipes.length === 0) {
                console.log('No recipes available for testing');
                return;
            }

            const testRecipe = recipes[0];
            const productionData = {
                name: 'Test Production with Invalid Steps',
                recipeId: testRecipe.id,
                targetQuantity: 5,
                targetUnit: 'pieces',
                notes: 'Test production run with invalid steps',
                customSteps: [] // Empty array should fall back to defaults
            };

            const response = await request(app)
                .post('/api/production/runs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productionData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            const productionRun = response.body.data;

            // Should fall back to default steps
            expect(productionRun.steps).toHaveLength(4);
            expect(productionRun.steps[0]).toHaveProperty('name', 'Preparation');
        });

        test('should return error for missing required fields', async () => {
            const invalidData = {
                name: 'Test Production',
                // Missing recipeId, targetQuantity, targetUnit
            };

            const response = await request(app)
                .post('/api/production/runs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });
});
