import request from 'supertest';
import app from '../index';

describe('Production Run Custom Steps API', () => {
    let server: any;

    beforeAll(async () => {
        // Start the server for testing
        server = app.listen(0); // Use port 0 to get a random available port
    });

    afterAll(async () => {
        // Close the server after tests
        if (server) {
            server.close();
        }
    });

    describe('POST /api/production/runs with custom steps', () => {
        test('should create production run with custom steps', async () => {
            // First, get a recipe to use for testing
            const recipesResponse = await request(app)
                .get('/api/recipes')
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
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });
});
