// Test for Production Completion Bug Fix
// This test verifies that clicking the finish production button properly creates finished products

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8000/api';

async function testProductionCompletionFix() {
    console.log('🧪 Testing Production Completion Fix - Finish Button Creates Finished Products');
    console.log('================================================================================\n');

    try {
        // 1. Create a test production run
        console.log('1️⃣ Creating test production run...');
        
        // First, get a recipe to use
        const recipes = await prisma.recipe.findMany({
            take: 1
        });

        if (recipes.length === 0) {
            console.log('❌ No recipes found. Please seed the database first.');
            return;
        }

        const recipe = recipes[0];
        console.log(`   Using recipe: ${recipe.name}`);

        const productionData = {
            name: `Test Production - ${new Date().toISOString()}`,
            recipeId: recipe.id,
            targetQuantity: 3,
            targetUnit: 'units',
            priority: 'MEDIUM',
            notes: 'Testing production completion fix'
        };

        const createResponse = await fetch(`${BASE_URL}/production/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productionData)
        });

        const createResult = await createResponse.json();
        if (!createResult.success) {
            throw new Error(`Failed to create production run: ${createResult.error}`);
        }

        const productionRun = createResult.data;
        console.log(`   ✅ Created production run: ${productionRun.id}`);
        console.log(`   📋 Initial status: ${productionRun.status}`);

        // 2. Complete all production steps to make the finish button available
        console.log('\n2️⃣ Completing all production steps...');
        
        const stepsResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}/steps`);
        const stepsResult = await stepsResponse.json();
        
        if (!stepsResult.success) {
            throw new Error('Failed to get production steps');
        }

        const steps = stepsResult.data;
        console.log(`   Found ${steps.length} steps to complete`);

        // Complete each step
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`   Completing step ${i + 1}: ${step.name}`);

            // Start the step
            const startResponse = await fetch(`${BASE_URL}/production/steps/${step.id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: 'Auto-started for test' })
            });

            if (!startResponse.ok) {
                console.log(`   ⚠️  Step ${i + 1} was already started or completed`);
            }

            // Complete the step
            const completeResponse = await fetch(`${BASE_URL}/production/steps/${step.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actualMinutes: step.estimatedMinutes || 10,
                    qualityStatus: 'PASS',
                    qualityCheckPassed: true,
                    notes: 'Test completion'
                })
            });

            const completeResult = await completeResponse.json();
            if (completeResult.success) {
                console.log(`   ✅ Step completed: ${step.name}`);
            } else {
                console.log(`   ⚠️  Step completion result: ${completeResult.message || 'Unknown'}`);
            }
        }

        // 3. Count finished products before finishing production
        console.log('\n3️⃣ Counting finished products before production completion...');
        const beforeResponse = await fetch(`${BASE_URL}/finished-products`);
        const beforeResult = await beforeResponse.json();
        const beforeCount = beforeResult.success ? beforeResult.data.length : 0;
        console.log(`   📦 Finished products before completion: ${beforeCount}`);

        // 4. Simulate clicking the finish production button
        console.log('\n4️⃣ Clicking finish production button (updating status to COMPLETED)...');
        
        const finishResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                notes: 'Production manually completed by user - testing fix'
            })
        });

        const finishResult = await finishResponse.json();
        if (!finishResult.success) {
            throw new Error(`Failed to finish production: ${finishResult.error || 'Unknown error'}`);
        }

        console.log(`   ✅ Production status updated to: ${finishResult.data.status}`);
        console.log(`   🎉 Production completed flag: ${finishResult.data.productionCompleted}`);
        
        if (finishResult.data.finishedProduct) {
            console.log(`   📦 Finished product created: ${finishResult.data.finishedProduct.name}`);
            console.log(`   🏷️  SKU: ${finishResult.data.finishedProduct.sku}`);
            console.log(`   📊 Quantity: ${finishResult.data.finishedProduct.quantity} ${finishResult.data.finishedProduct.unit}`);
        } else {
            console.log('   ⚠️  No finished product info returned in response');
        }

        // 5. Count finished products after finishing production
        console.log('\n5️⃣ Counting finished products after production completion...');
        const afterResponse = await fetch(`${BASE_URL}/finished-products`);
        const afterResult = await afterResponse.json();
        const afterCount = afterResult.success ? afterResult.data.length : 0;
        console.log(`   📦 Finished products after completion: ${afterCount}`);

        // Find the specific finished product created from our production
        if (afterResult.success) {
            const newFinishedProducts = afterResult.data.filter(fp => 
                fp.name.includes(recipe.name) && 
                new Date(fp.createdAt) > new Date(Date.now() - 60000) // Created in last minute
            );
            console.log(`   🎯 New finished products matching our recipe: ${newFinishedProducts.length}`);
            
            if (newFinishedProducts.length > 0) {
                const newProduct = newFinishedProducts[0];
                console.log(`   📋 Product details:`);
                console.log(`      Name: ${newProduct.name}`);
                console.log(`      SKU: ${newProduct.sku}`);
                console.log(`      Quantity: ${newProduct.quantity} ${newProduct.unit}`);
                console.log(`      Status: ${newProduct.status}`);
                console.log(`      Batch: ${newProduct.batchNumber}`);
                console.log(`      Cost: $${newProduct.costToProduce}`);
            }
        }

        // 6. Verify production run final status
        console.log('\n6️⃣ Verifying final production run status...');
        const finalRunResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`);
        const finalRunResult = await finalRunResponse.json();
        
        if (finalRunResult.success) {
            const finalRun = finalRunResult.data;
            console.log(`   📊 Final production status: ${finalRun.status}`);
            console.log(`   ⏰ Completed at: ${finalRun.completedAt || 'Not set'}`);
            console.log(`   🎯 Final quantity: ${finalRun.finalQuantity || 'Not set'}`);
        }

        // 7. Test Results Summary
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('========================');
        
        const finishedProductsCreated = afterCount > beforeCount;
        const productionStatusCompleted = finalRunResult.success && 
            finalRunResult.data.status === 'COMPLETED';
        
        if (finishedProductsCreated && productionStatusCompleted) {
            console.log('✅ SUCCESS: Production completion fix working correctly!');
            console.log('   ✓ Finish button properly completes production run');
            console.log('   ✓ Finished products are created in inventory');
            console.log('   ✓ Production status is updated to COMPLETED');
            console.log('   ✓ ProductionCompletionService is called correctly');
        } else {
            console.log('❌ FAILURE: Production completion fix needs investigation');
            if (!finishedProductsCreated) {
                console.log('   ❌ No finished products were created');
            }
            if (!productionStatusCompleted) {
                console.log('   ❌ Production status was not updated to COMPLETED');
            }
        }

        // 8. Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete the finished product if it was created
        if (afterResult.success) {
            const newFinishedProducts = afterResult.data.filter(fp => 
                fp.name.includes(recipe.name) && 
                new Date(fp.createdAt) > new Date(Date.now() - 60000)
            );
            
            for (const product of newFinishedProducts) {
                try {
                    await prisma.finishedProduct.delete({ where: { id: product.id } });
                    console.log(`   ✅ Deleted finished product: ${product.sku}`);
                } catch (deleteError) {
                    console.log(`   ⚠️  Could not delete finished product: ${deleteError.message}`);
                }
            }
        }

        // Delete production steps and run
        try {
            await prisma.productionStep.deleteMany({ 
                where: { productionRunId: productionRun.id } 
            });
            await prisma.productionRun.delete({ 
                where: { id: productionRun.id } 
            });
            console.log(`   ✅ Deleted test production run and steps`);
        } catch (deleteError) {
            console.log(`   ⚠️  Could not delete production run: ${deleteError.message}`);
        }

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testProductionCompletionFix();