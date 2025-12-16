// Test: Production quantity limits based on ingredient availability
// Run standalone: node backend/test-production-quantity-limits.js
// Or with npm test in backend directory

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const BASE_URL = process.env.API_URL || 'http://localhost:8000';

// Helper to authenticate
async function authenticate() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        return {
            token: response.data.data.token,
            clientId: response.data.data.user.client.id
        };
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
        throw error;
    }
}

(async () => {
    console.log('\n=== Production Quantity Limits Test Suite ===\n');
    
    let authToken, clientId;
    let testRecipe;
    let testMaterials = [];
    let testsRun = 0;
    let testsPassed = 0;

    try {
        // Authenticate
        console.log('🔐 Authenticating...');
        const auth = await authenticate();
        authToken = auth.token;
        clientId = auth.clientId;
        console.log(`✅ Authenticated with clientId: ${clientId}\n`);

        // Create test raw materials with specific quantities
        console.log('📦 Creating test materials...');
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 6); // 6 months from now

        const flour = await prisma.rawMaterial.create({
            data: {
                name: 'Test Quantity Flour',
                sku: 'TEST-QTY-FLOUR',
                batchNumber: 'BATCH-FLOUR-001',
                unit: 'kg',
                currentStock: 5.0, // 5kg available
                reorderLevel: 2,
                reorderQuantity: 10,
                supplierName: 'Test Supplier',
                costPerUnit: 2.50,
                expirationDate,
                clientId
            }
        });

        const sugar = await prisma.rawMaterial.create({
            data: {
                name: 'Test Quantity Sugar',
                sku: 'TEST-QTY-SUGAR',
                batchNumber: 'BATCH-SUGAR-001',
                unit: 'kg',
                currentStock: 10.0, // 10kg available
                reorderLevel: 2,
                reorderQuantity: 10,
                supplierName: 'Test Supplier',
                costPerUnit: 1.50,
                expirationDate,
                clientId
            }
        });

        const butter = await prisma.rawMaterial.create({
            data: {
                name: 'Test Quantity Butter',
                sku: 'TEST-QTY-BUTTER',
                batchNumber: 'BATCH-BUTTER-001',
                unit: 'kg',
                currentStock: 3.0, // 3kg available
                reorderLevel: 1,
                reorderQuantity: 5,
                supplierName: 'Test Supplier',
                costPerUnit: 5.00,
                expirationDate,
                clientId
            }
        });

        testMaterials = [flour, sugar, butter];
        console.log(`✅ Created ${testMaterials.length} test materials\n`);

        // Create test recipe that requires:
        // - 1kg flour per batch (max 5 batches)
        // - 0.5kg sugar per batch (max 20 batches)
        // - 0.5kg butter per batch (max 6 batches)
        // Limiting ingredient: flour (5 batches max)
        console.log('📝 Creating test recipe...');
        testRecipe = await prisma.recipe.create({
            data: {
                name: 'Test Quantity Cake',
                sku: 'TEST-QTY-CAKE',
                category: 'Cakes',
                yieldQuantity: 12,
                yieldUnit: 'pieces',
                estimatedTotalTime: 120,
                clientId,
                ingredients: {
                    create: [
                        {
                            quantity: 1.0,
                            unit: 'kg',
                            rawMaterialId: flour.id
                        },
                        {
                            quantity: 0.5,
                            unit: 'kg',
                            rawMaterialId: sugar.id
                        },
                        {
                            quantity: 0.5,
                            unit: 'kg',
                            rawMaterialId: butter.id
                        }
                    ]
                }
            }
        });
        console.log(`✅ Created recipe: ${testRecipe.name} (ID: ${testRecipe.id})\n`);

        // Test 1: Calculate max batches
        console.log('Test 1: Calculate max batches based on ingredient availability');
        testsRun++;
        try {
            const response = await axios.get(
                `${BASE_URL}/api/recipes/${testRecipe.id}/calculate-max-batches`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const data = response.data.data;
            if (data.maxBatches === 5 && data.maxProducibleQuantity === 60) {
                console.log('  ✅ Correctly calculated max 5 batches (60 pieces)');
                testsPassed++;
            } else {
                console.log(`  ❌ Expected 5 batches, got ${data.maxBatches}`);
            }
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
        }

        // Test 2: Identify limiting ingredient
        console.log('\nTest 2: Correctly identify the limiting ingredient');
        testsRun++;
        try {
            const response = await axios.get(
                `${BASE_URL}/api/recipes/${testRecipe.id}/calculate-max-batches`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const data = response.data.data;
            if (data.limitingIngredient?.name === 'Test Quantity Flour' &&
                data.limitingIngredient.available === 5.0 &&
                data.limitingIngredient.neededPerBatch === 1.0) {
                console.log('  ✅ Correctly identified flour as limiting ingredient');
                testsPassed++;
            } else {
                console.log(`  ❌ Wrong limiting ingredient: ${JSON.stringify(data.limitingIngredient)}`);
            }
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
        }

        // Test 3: Detailed ingredient breakdown
        console.log('\nTest 3: Provide detailed ingredient breakdown');
        testsRun++;
        try {
            const response = await axios.get(
                `${BASE_URL}/api/recipes/${testRecipe.id}/calculate-max-batches`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const data = response.data.data;
            if (data.ingredientDetails?.length === 3) {
                const flour = data.ingredientDetails.find(i => i.name === 'Test Quantity Flour');
                const sugar = data.ingredientDetails.find(i => i.name === 'Test Quantity Sugar');
                const butter = data.ingredientDetails.find(i => i.name === 'Test Quantity Butter');

                if (flour?.maxBatchesFromThis === 5 &&
                    sugar?.maxBatchesFromThis === 20 &&
                    butter?.maxBatchesFromThis === 6) {
                    console.log('  ✅ Correct max batches for each ingredient:');
                    console.log('     - Flour: 5 batches');
                    console.log('     - Sugar: 20 batches');
                    console.log('     - Butter: 6 batches');
                    testsPassed++;
                } else {
                    console.log('  ❌ Wrong max batches calculations');
                }
            } else {
                console.log(`  ❌ Expected 3 ingredients, got ${data.ingredientDetails?.length}`);
            }
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
        }

        // Test 4: Handle zero stock
        console.log('\nTest 4: Handle ingredient with zero stock');
        testsRun++;
        try {
            await prisma.rawMaterial.update({
                where: { id: flour.id },
                data: { currentStock: 0 }
            });

            const response = await axios.get(
                `${BASE_URL}/api/recipes/${testRecipe.id}/calculate-max-batches`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const data = response.data.data;
            if (data.maxBatches === 0 && data.maxProducibleQuantity === 0) {
                console.log('  ✅ Correctly returned 0 batches with zero stock');
                testsPassed++;
            } else {
                console.log(`  ❌ Expected 0 batches, got ${data.maxBatches}`);
            }

            // Restore stock
            await prisma.rawMaterial.update({
                where: { id: flour.id },
                data: { currentStock: 5.0 }
            });
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
        }

        // Test 5: Fractional batch calculations
        console.log('\nTest 5: Handle fractional batch calculations correctly');
        testsRun++;
        try {
            await prisma.rawMaterial.update({
                where: { id: flour.id },
                data: { currentStock: 2.7 } // 2.7kg = 2.7 batches, should round down to 2
            });

            const response = await axios.get(
                `${BASE_URL}/api/recipes/${testRecipe.id}/calculate-max-batches`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const data = response.data.data;
            if (data.maxBatches === 2 && data.maxProducibleQuantity === 24) {
                console.log('  ✅ Correctly rounded down 2.7 batches to 2 batches (24 pieces)');
                testsPassed++;
            } else {
                console.log(`  ❌ Expected 2 batches, got ${data.maxBatches}`);
            }

            // Restore stock
            await prisma.rawMaterial.update({
                where: { id: flour.id },
                data: { currentStock: 5.0 }
            });
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
        }

        // Test 6: Production creation with insufficient ingredients
        console.log('\nTest 6: Verify detailed error when exceeding ingredient limits');
        testsRun++;
        try {
            const response = await axios.post(
                `${BASE_URL}/api/production`,
                {
                    name: 'Test Production - Exceeds Limits',
                    recipeId: testRecipe.id,
                    targetQuantity: 120, // 10 batches * 12 pieces (exceeds flour limit of 5 batches)
                    targetUnit: 'pieces'
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log('  ❌ Should have failed with ingredient shortage error');
        } catch (error) {
            if (error.response?.status === 400) {
                const errorData = error.response.data;
                if (errorData.details?.unavailableIngredients) {
                    const flourShortage = errorData.details.unavailableIngredients.find(
                        item => item.name === 'Test Quantity Flour'
                    );
                    if (flourShortage && flourShortage.shortage === 5.0) {
                        console.log('  ✅ Correctly returned detailed shortage information:');
                        console.log(`     - Need: ${flourShortage.needed}kg`);
                        console.log(`     - Have: ${flourShortage.available}kg`);
                        console.log(`     - Shortage: ${flourShortage.shortage}kg`);
                        testsPassed++;
                    } else {
                        console.log('  ❌ Incorrect shortage calculation');
                    }
                } else {
                    console.log('  ❌ Missing unavailableIngredients in error details');
                }
            } else {
                console.log(`  ❌ Wrong error status: ${error.response?.status}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Test suite error:', error.message);
        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        try {
            if (testRecipe) {
                await prisma.recipeIngredient.deleteMany({
                    where: { recipeId: testRecipe.id }
                });
                await prisma.recipe.delete({
                    where: { id: testRecipe.id }
                });
            }

            for (const material of testMaterials) {
                await prisma.rawMaterial.delete({
                    where: { id: material.id }
                });
            }
            console.log('✅ Cleanup completed');
        } catch (cleanupError) {
            console.error('⚠️  Cleanup error:', cleanupError.message);
        }

        await prisma.$disconnect();

        // Print summary
        console.log('\n=== Test Summary ===');
        console.log(`Tests run: ${testsRun}`);
        console.log(`Tests passed: ${testsPassed}`);
        console.log(`Tests failed: ${testsRun - testsPassed}`);
        console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

        if (testsPassed === testsRun) {
            console.log('\n✅ All tests passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed');
            process.exit(1);
        }
    }
})();
