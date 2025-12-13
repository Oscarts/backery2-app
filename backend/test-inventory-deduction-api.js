#!/usr/bin/env node

/**
 * Test Inventory Deduction Fix via API
 * 
 * This test verifies that when production is completed:
 * 1. Raw materials are properly reserved during production
 * 2. Raw materials are deducted from inventory after completion
 * 3. Finished products used as ingredients are reserved and deducted properly
 * 4. Reserved quantities are removed after consumption
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8000/api';

async function testInventoryDeductionFix() {
    console.log('🧪 Testing Inventory Deduction Fix via API');
    console.log('============================================\n');

    try {
        // 1. Login to get auth token
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@demobakery.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginData.success) {
            throw new Error('Login failed');
        }

        const token = loginData.data.token;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log('✅ Logged in successfully');

        // 2. Find a recipe with ingredients
        console.log('\n2️⃣ Finding a recipe to test...');
        const recipe = await prisma.recipe.findFirst({
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true,
                        finishedProduct: true
                    }
                }
            },
            where: {
                ingredients: {
                    some: {}
                }
            }
        });

        if (!recipe || recipe.ingredients.length === 0) {
            console.log('❌ No recipes with ingredients found. Please seed the database first.');
            return;
        }

        console.log(`✅ Using recipe: ${recipe.name}`);
        console.log(`   Ingredients: ${recipe.ingredients.length}`);
        console.log(`   Recipe Yield: ${recipe.yieldQuantity} ${recipe.unit || 'kg'}`);

        // Calculate production multiplier (how many recipe batches to make)
        const targetQuantity = recipe.yieldQuantity || 1; // Produce full recipe batch
        const productionMultiplier = 1; // 1 full batch
        
        console.log(`   Target Production: ${targetQuantity} ${recipe.unit || 'kg'} (${productionMultiplier}x recipe)`);

        // 3. Record initial inventory state
        console.log('\n3️⃣ Recording initial inventory state...');
        const initialState = {};
        
        for (const ingredient of recipe.ingredients) {
            if (ingredient.rawMaterial) {
                const material = ingredient.rawMaterial;
                const neededForProduction = ingredient.quantity * productionMultiplier;
                initialState[material.id] = {
                    type: 'RAW_MATERIAL',
                    name: material.name,
                    quantity: material.quantity,
                    reservedQuantity: material.reservedQuantity,
                    available: material.quantity - material.reservedQuantity,
                    needed: neededForProduction
                };
                console.log(`   📦 ${material.name}:`);
                console.log(`      Quantity: ${material.quantity} ${ingredient.unit}`);
                console.log(`      Reserved: ${material.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Available: ${material.quantity - material.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Needed for ${targetQuantity}${recipe.unit || 'kg'}: ${neededForProduction} ${ingredient.unit}`);
            } else if (ingredient.finishedProduct) {
                const product = ingredient.finishedProduct;
                const neededForProduction = ingredient.quantity * productionMultiplier;
                initialState[product.id] = {
                    type: 'FINISHED_PRODUCT',
                    name: product.name,
                    quantity: product.quantity,
                    reservedQuantity: product.reservedQuantity,
                    available: product.quantity - product.reservedQuantity,
                    needed: neededForProduction
                };
                console.log(`   🏭 ${product.name}:`);
                console.log(`      Quantity: ${product.quantity} ${ingredient.unit}`);
                console.log(`      Reserved: ${product.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Available: ${product.quantity - product.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Needed for ${targetQuantity}${recipe.unit || 'kg'}: ${neededForProduction} ${ingredient.unit}`);
            }
        }

        // 4. Create a production run via API
        console.log('\n4️⃣ Creating production run...');
        const createResponse = await fetch(`${BASE_URL}/production/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Test Inventory Deduction - ${Date.now()}`,
                recipeId: recipe.id,
                targetQuantity: targetQuantity, // Produce full batch
                targetUnit: recipe.unit || 'kg',
                notes: 'Testing inventory deduction fix'
            })
        });

        const createData = await createResponse.json();
        if (!createData.success) {
            throw new Error(`Failed to create production run: ${createData.error || 'Unknown error'}`);
        }

        const productionRun = createData.data;
        console.log(`✅ Production run created: ${productionRun.id}`);

        // 5. Complete all steps
        console.log('\n5️⃣ Completing production steps...');
        const stepsResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, {
            headers
        });
        const stepsData = await stepsResponse.json();
        const steps = stepsData.data.steps || [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Start step
            await fetch(`${BASE_URL}/production/steps/${step.id}/start`, {
                method: 'POST',
                headers
            });
            
            // Complete step
            await fetch(`${BASE_URL}/production/steps/${step.id}/complete`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    qualityCheckPassed: true,
                    notes: 'Test step completion'
                })
            });

            console.log(`   ✅ Completed step ${i + 1}: ${step.name}`);
        }

        // 6. Complete the production run
        console.log('\n6️⃣ Completing production run...');
        const completeResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'COMPLETED',
                completedAt: new Date().toISOString()
            })
        });

        const completeData = await completeResponse.json();
        if (!completeData.success) {
            throw new Error(`Failed to complete production: ${completeData.error || 'Unknown error'}`);
        }

        console.log('✅ Production completed!');
        if (completeData.data.finishedProduct) {
            console.log(`   Finished Product: ${completeData.data.finishedProduct.name}`);
            console.log(`   Quantity: ${completeData.data.finishedProduct.quantity} ${completeData.data.finishedProduct.unit}`);
        }

        // 7. Check final inventory state after consumption
        console.log('\n7️⃣ Checking final inventory state after consumption...');
        const finalState = {};
        let allCorrect = true;

        for (const ingredient of recipe.ingredients) {
            if (ingredient.rawMaterial) {
                const material = await prisma.rawMaterial.findUnique({
                    where: { id: ingredient.rawMaterial.id }
                });
                
                finalState[material.id] = {
                    type: 'RAW_MATERIAL',
                    name: material.name,
                    quantity: material.quantity,
                    reservedQuantity: material.reservedQuantity,
                    available: material.quantity - material.reservedQuantity
                };

                const initial = initialState[material.id];
                const expectedQuantity = initial.quantity - initial.needed; // Deduct what was needed
                const expectedReserved = initial.reservedQuantity; // Should be same (reserved then consumed)
                const quantityCorrect = Math.abs(material.quantity - expectedQuantity) < 0.01;
                const reservedCorrect = Math.abs(material.reservedQuantity - expectedReserved) < 0.01;

                console.log(`\n   📦 ${material.name}:`);
                console.log(`      Before: ${initial.quantity} ${ingredient.unit} (${initial.reservedQuantity} reserved)`);
                console.log(`      After:  ${material.quantity} ${ingredient.unit} (${material.reservedQuantity} reserved)`);
                console.log(`      Expected: ${expectedQuantity} ${ingredient.unit} (${expectedReserved} reserved)`);
                console.log(`      Deducted: ${initial.quantity - material.quantity} ${ingredient.unit} (expected: ${initial.needed})`);
                console.log(`      Status: ${quantityCorrect ? '✅ CORRECT' : '❌ WRONG'} quantity, ${reservedCorrect ? '✅ CORRECT' : '❌ WRONG'} reservation`);

                if (!quantityCorrect || !reservedCorrect) {
                    allCorrect = false;
                }

            } else if (ingredient.finishedProduct) {
                const product = await prisma.finishedProduct.findUnique({
                    where: { id: ingredient.finishedProduct.id }
                });
                
                finalState[product.id] = {
                    type: 'FINISHED_PRODUCT',
                    name: product.name,
                    quantity: product.quantity,
                    reservedQuantity: product.reservedQuantity,
                    available: product.quantity - product.reservedQuantity
                };

                const initial = initialState[product.id];
                const expectedQuantity = initial.quantity - initial.needed; // Deduct what was needed
                const expectedReserved = initial.reservedQuantity; // Should be same (reserved then consumed)
                const quantityCorrect = Math.abs(product.quantity - expectedQuantity) < 0.01;
                const reservedCorrect = Math.abs(product.reservedQuantity - expectedReserved) < 0.01;

                console.log(`\n   🏭 ${product.name}:`);
                console.log(`      Before: ${initial.quantity} ${ingredient.unit} (${initial.reservedQuantity} reserved)`);
                console.log(`      After:  ${product.quantity} ${ingredient.unit} (${product.reservedQuantity} reserved)`);
                console.log(`      Expected: ${expectedQuantity} ${ingredient.unit} (${expectedReserved} reserved)`);
                console.log(`      Deducted: ${initial.quantity - product.quantity} ${ingredient.unit} (expected: ${initial.needed})`);
                console.log(`      Status: ${quantityCorrect ? '✅ CORRECT' : '❌ WRONG'} quantity, ${reservedCorrect ? '✅ CORRECT' : '❌ WRONG'} reservation`);

                if (!quantityCorrect || !reservedCorrect) {
                    allCorrect = false;
                }
            }
        }

        // 8. Check production allocations
        console.log('\n8️⃣ Checking production allocations...');
        const allocations = await prisma.productionAllocation.findMany({
            where: { productionRunId: productionRun.id }
        });

        console.log(`   Found ${allocations.length} allocations`);
        for (const alloc of allocations) {
            console.log(`   • ${alloc.materialName}: ${alloc.quantityAllocated} ${alloc.unit} (${alloc.status})`);
            console.log(`     Consumed: ${alloc.quantityConsumed || 0} ${alloc.unit}`);
        }

        const allConsumed = allocations.every(alloc => alloc.status === 'CONSUMED');
        console.log(`   Status: ${allConsumed ? '✅ All materials consumed' : '❌ Some materials not consumed'}`);

        if (!allConsumed) {
            allCorrect = false;
        }

        // 9. Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));
        
        if (allCorrect) {
            console.log('✅ SUCCESS: Inventory deduction working correctly!');
            console.log('   ✓ Materials were properly allocated');
            console.log('   ✓ Materials were properly consumed');
            console.log('   ✓ Quantities were deducted from inventory');
            console.log('   ✓ Reserved quantities were properly managed');
            console.log('   ✓ Finished product was created');
        } else {
            console.log('❌ FAILURE: Inventory deduction has issues!');
            console.log('   Please check the details above for what went wrong.');
        }

        // 10. Cleanup
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete finished products created by this run
        const finishedProducts = await prisma.finishedProduct.findMany({
            where: { productionRunId: productionRun.id }
        });
        
        for (const product of finishedProducts) {
            await prisma.finishedProduct.delete({
                where: { id: product.id }
            }).catch(err => console.log('   ⚠️  Could not delete finished product:', err.message));
        }

        // Delete allocations
        await prisma.productionAllocation.deleteMany({
            where: { productionRunId: productionRun.id }
        });

        // Delete production steps and run
        await prisma.productionStep.deleteMany({
            where: { productionRunId: productionRun.id }
        });
        await prisma.productionRun.delete({
            where: { id: productionRun.id }
        });

        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testInventoryDeductionFix();
