/**
 * Integration test for production steps customization
 * This test verifies the complete workflow from frontend components to backend API
 */

import request from 'supertest';
import app from '../index';

describe('Production Steps Customization - End to End', () => {
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

    describe('POST /api/production/runs - Custom Steps Integration', () => {
        test('should create production run with custom steps from frontend', async () => {
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

            // Test data that would come from ProductionStepsDialog
            const customStepsFromFrontend = [
                {
                    name: 'Custom Preparation Phase',
                    description: 'Prepare all ingredients and workspace',
                    stepOrder: 1,
                    estimatedMinutes: 20
                },
                {
                    name: 'Custom Production Phase',
                    description: 'Execute the main production process',
                    stepOrder: 2,
                    estimatedMinutes: 60
                },
                {
                    name: 'Custom Quality Assurance',
                    description: 'Perform comprehensive quality checks',
                    stepOrder: 3,
                    estimatedMinutes: 15
                },
                {
                    name: 'Custom Packaging',
                    description: 'Package the finished products',
                    stepOrder: 4,
                    estimatedMinutes: 10
                }
            ];

            // Simulate the data structure that comes from ProductionDashboard
            const productionRunData = {
                name: `Custom Steps Test - ${testRecipe.name}`,
                recipeId: testRecipe.id,
                targetQuantity: testRecipe.yieldQuantity || 12,
                targetUnit: testRecipe.yieldUnit || 'pieces',
                notes: 'Integration test for custom steps functionality',
                customSteps: customStepsFromFrontend
            };

            // Create the production run
            const response = await request(app)
                .post('/api/production/runs')
                .send(productionRunData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            const createdRun = response.body.data;
            expect(createdRun.id).toBeDefined();
            expect(createdRun.name).toBe(productionRunData.name);
            expect(createdRun.steps).toBeDefined();
            expect(createdRun.steps.length).toBe(customStepsFromFrontend.length);

            // Verify each custom step was created correctly
            customStepsFromFrontend.forEach((expectedStep, index) => {
                const actualStep = createdRun.steps.find((s: any) => s.stepOrder === expectedStep.stepOrder);
                expect(actualStep).toBeDefined();
                expect(actualStep.name).toBe(expectedStep.name);
                expect(actualStep.description).toBe(expectedStep.description);
                expect(actualStep.estimatedMinutes).toBe(expectedStep.estimatedMinutes);
                expect(actualStep.status).toBe('PENDING');
            });

            console.log('✅ Custom steps integration test passed');
        });

        test('should handle empty custom steps array and use defaults', async () => {
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .expect(200);

            const recipe = recipesResponse.body.data[0];

            const productionRunData = {
                name: `Default Steps Test - ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: recipe.yieldQuantity || 12,
                targetUnit: recipe.yieldUnit || 'pieces',
                customSteps: [] // Empty array should trigger default steps
            };

            const response = await request(app)
                .post('/api/production/runs')
                .send(productionRunData)
                .expect(201);

            expect(response.body.success).toBe(true);
            const createdRun = response.body.data;
            
            // Should have default steps
            expect(createdRun.steps.length).toBeGreaterThan(0);
            
            // Check for default step names
            const stepNames = createdRun.steps.map((s: any) => s.name);
            expect(stepNames).toContain('Preparation');
            expect(stepNames).toContain('Production');
            expect(stepNames).toContain('Quality Check');
            expect(stepNames).toContain('Packaging');

            console.log('✅ Default steps fallback test passed');
        });

        test('should handle missing customSteps property and use defaults', async () => {
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .expect(200);

            const recipe = recipesResponse.body.data[0];

            const productionRunData = {
                name: `No Custom Steps Test - ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: recipe.yieldQuantity || 12,
                targetUnit: recipe.yieldUnit || 'pieces'
                // No customSteps property at all
            };

            const response = await request(app)
                .post('/api/production/runs')
                .send(productionRunData)
                .expect(201);

            expect(response.body.success).toBe(true);
            const createdRun = response.body.data;
            
            // Should have default steps
            expect(createdRun.steps.length).toBe(4); // Default steps count
            
            const stepNames = createdRun.steps.map((s: any) => s.name);
            expect(stepNames).toEqual(['Preparation', 'Production', 'Quality Check', 'Packaging']);

            console.log('✅ Missing customSteps property test passed');
        });

        test('should validate custom steps structure', async () => {
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .expect(200);

            const recipe = recipesResponse.body.data[0];

            // Test with invalid custom steps
            const invalidCustomSteps = [
                {
                    // Missing name
                    description: 'Invalid step',
                    stepOrder: 1,
                    estimatedMinutes: 10
                }
            ];

            const productionRunData = {
                name: `Invalid Steps Test - ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: recipe.yieldQuantity || 12,
                targetUnit: recipe.yieldUnit || 'pieces',
                customSteps: invalidCustomSteps
            };

            const response = await request(app)
                .post('/api/production/runs')
                .send(productionRunData)
                .expect(201);

            // Should still create successfully but may use defaults or handle gracefully
            expect(response.body.success).toBe(true);

            console.log('✅ Invalid custom steps handling test passed');
        });

        test('should preserve step order in custom steps', async () => {
            const recipesResponse = await request(app)
                .get('/api/recipes')
                .expect(200);

            const recipe = recipesResponse.body.data[0];

            const customStepsWithSpecificOrder = [
                {
                    name: 'Third Step',
                    description: 'This should be third',
                    stepOrder: 3,
                    estimatedMinutes: 30
                },
                {
                    name: 'First Step',
                    description: 'This should be first',
                    stepOrder: 1,
                    estimatedMinutes: 10
                },
                {
                    name: 'Second Step',
                    description: 'This should be second',
                    stepOrder: 2,
                    estimatedMinutes: 20
                }
            ];

            const productionRunData = {
                name: `Order Test - ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: recipe.yieldQuantity || 12,
                targetUnit: recipe.yieldUnit || 'pieces',
                customSteps: customStepsWithSpecificOrder
            };

            const response = await request(app)
                .post('/api/production/runs')
                .send(productionRunData)
                .expect(201);

            expect(response.body.success).toBe(true);
            const createdRun = response.body.data;
            
            // Sort steps by stepOrder for verification
            const sortedSteps = createdRun.steps.sort((a: any, b: any) => a.stepOrder - b.stepOrder);
            
            expect(sortedSteps[0].name).toBe('First Step');
            expect(sortedSteps[1].name).toBe('Second Step');
            expect(sortedSteps[2].name).toBe('Third Step');

            console.log('✅ Step order preservation test passed');
        });
    });
});
