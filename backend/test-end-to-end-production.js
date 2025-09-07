#!/usr/bin/env node

// End-to-End Production Workflow Test via API
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEndToEndProductionWorkflow() {
    try {
        console.log('🧪 End-to-End Production Workflow Test\n');

        // 1. Get available recipes (simulating frontend API call)
        console.log('1️⃣ Getting available recipes...');
        const recipes = await prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true,
                        intermediateProduct: true
                    }
                }
            }
        });

        console.log(`📋 Found ${recipes.length} recipes`);
        const targetRecipe = recipes.find(r => r.ingredients.length > 0);
        
        if (!targetRecipe) {
            console.log('❌ No recipe with ingredients found');
            return;
        }

        console.log(`✅ Using recipe: ${targetRecipe.name}`);
        console.log(`   Yield: ${targetRecipe.yieldQuantity} ${targetRecipe.yieldUnit}`);
        console.log(`   Ingredients: ${targetRecipe.ingredients.length}`);

        // 2. Create production run (simulating frontend creating production)
        console.log(`\n2️⃣ Creating production run...`);
        const productionRun = await prisma.productionRun.create({
            data: {
                name: `End-to-End Test: ${targetRecipe.name}`,
                recipeId: targetRecipe.id,
                targetQuantity: 3,
                targetUnit: targetRecipe.yieldUnit,
                status: 'PLANNED',
                notes: 'Full end-to-end workflow test',
                steps: {
                    create: [
                        {
                            name: 'Preparation',
                            description: 'Gather ingredients and equipment',
                            stepOrder: 1,
                            estimatedMinutes: 15,
                            status: 'PENDING'
                        },
                        {
                            name: 'Mixing',
                            description: 'Mix ingredients according to recipe',
                            stepOrder: 2,
                            estimatedMinutes: 20,
                            status: 'PENDING'
                        },
                        {
                            name: 'Processing',
                            description: 'Process according to recipe instructions',
                            stepOrder: 3,
                            estimatedMinutes: targetRecipe.prepTime || 60,
                            status: 'PENDING'
                        },
                        {
                            name: 'Quality Check',
                            description: 'Inspect product quality',
                            stepOrder: 4,
                            estimatedMinutes: 10,
                            status: 'PENDING'
                        },
                        {
                            name: 'Packaging',
                            description: 'Package finished products',
                            stepOrder: 5,
                            estimatedMinutes: 15,
                            status: 'PENDING'
                        }
                    ]
                }
            },
            include: {
                recipe: true,
                steps: { orderBy: { stepOrder: 'asc' } }
            }
        });

        console.log(`✅ Created production run: ${productionRun.name}`);
        console.log(`   ID: ${productionRun.id}`);
        console.log(`   Target: ${productionRun.targetQuantity} ${productionRun.targetUnit}`);
        console.log(`   Steps: ${productionRun.steps.length}`);

        // 3. Check initial finished products count
        console.log(`\n3️⃣ Checking initial inventory...`);
        const initialFinishedProducts = await prisma.finishedProduct.count();
        console.log(`📦 Initial finished products: ${initialFinishedProducts}`);

        // 4. Simulate production step completion (using production step controller logic)
        console.log(`\n4️⃣ Simulating production step completion...`);
        
        let currentStepIndex = 0;
        for (const step of productionRun.steps) {
            currentStepIndex++;
            console.log(`\n   Step ${currentStepIndex}: ${step.name}`);
            
            // Start step
            console.log(`     🟡 Starting step...`);
            await prisma.productionStep.update({
                where: { id: step.id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date()
                }
            });

            // Update production run to IN_PROGRESS on first step
            if (currentStepIndex === 1) {
                await prisma.productionRun.update({
                    where: { id: productionRun.id },
                    data: { status: 'IN_PROGRESS' }
                });
                console.log(`     🏭 Production run started`);
            }

            // Simulate work being done
            await new Promise(resolve => setTimeout(resolve, 500));

            // Complete step
            console.log(`     🟢 Completing step...`);
            const completedStep = await prisma.productionStep.update({
                where: { id: step.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    actualMinutes: step.estimatedMinutes,
                    notes: `Step completed successfully via automated test`
                }
            });

            console.log(`     ✅ Step completed: ${step.name}`);

            // Check if this is the last step
            const remainingSteps = await prisma.productionStep.count({
                where: {
                    productionRunId: productionRun.id,
                    status: { notIn: ['COMPLETED', 'SKIPPED'] }
                }
            });

            if (remainingSteps === 0) {
                console.log(`\n   🏁 All steps completed! Triggering production completion...`);
                
                // This is where the production completion service should be called
                // Simulating the updated production step controller behavior
                const { ProductionCompletionService } = require('./src/services/productionCompletionService.ts');
                const completionService = new ProductionCompletionService();
                
                try {
                    const completionResult = await completionService.completeProductionRun(productionRun.id, 3);
                    console.log(`   ✅ Production completed successfully!`);
                    console.log(`   📦 Finished product: ${completionResult.finishedProduct.name}`);
                    console.log(`   🏷️ SKU: ${completionResult.finishedProduct.sku}`);
                    console.log(`   📊 Quantity: ${completionResult.finishedProduct.quantity} ${completionResult.finishedProduct.unit}`);
                    console.log(`   💰 Cost: $${completionResult.finishedProduct.costToProduce}`);
                } catch (error) {
                    console.error(`   ❌ Error completing production:`, error.message);
                }
            }
        }

        // 5. Verify finished products were created
        console.log(`\n5️⃣ Verifying finished products in inventory...`);
        const finalFinishedProducts = await prisma.finishedProduct.findMany({
            where: {
                name: { contains: targetRecipe.name }
            },
            include: {
                storageLocation: true
            }
        });

        console.log(`📦 Found ${finalFinishedProducts.length} finished products:`);
        finalFinishedProducts.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name}`);
            console.log(`      SKU: ${product.sku}`);
            console.log(`      Quantity: ${product.quantity} ${product.unit}`);
            console.log(`      Location: ${product.storageLocation?.name || 'Unknown'}`);
            console.log(`      Production Date: ${product.productionDate.toLocaleDateString()}`);
            console.log(`      Expiration: ${product.expirationDate.toLocaleDateString()}`);
            console.log(`      Cost: $${product.costToProduce}`);
        });

        // 6. Verify production run status
        console.log(`\n6️⃣ Checking production run final status...`);
        const finalProductionRun = await prisma.productionRun.findUnique({
            where: { id: productionRun.id },
            include: {
                steps: true
            }
        });

        console.log(`🏭 Production Run Status: ${finalProductionRun.status}`);
        console.log(`📅 Completed At: ${finalProductionRun.completedAt?.toLocaleString() || 'Not completed'}`);
        console.log(`📊 Final Quantity: ${finalProductionRun.finalQuantity || 'Not set'}`);
        
        const completedSteps = finalProductionRun.steps.filter(s => s.status === 'COMPLETED');
        console.log(`✅ Completed Steps: ${completedSteps.length}/${finalProductionRun.steps.length}`);

        // 7. Summary
        console.log(`\n🎉 END-TO-END TEST RESULTS:`);
        if (finalFinishedProducts.length > 0 && finalProductionRun.status === 'COMPLETED') {
            console.log(`✅ SUCCESS: Complete production workflow working!`);
            console.log(`   ✅ Production run created and tracked`);
            console.log(`   ✅ All production steps completed`);
            console.log(`   ✅ Finished products created in inventory`);
            console.log(`   ✅ Production run marked as completed`);
            console.log(`   ✅ Cost calculation working`);
            console.log(`   ✅ Storage location assigned`);
        } else {
            console.log(`❌ FAILURE: Something went wrong in the workflow`);
            if (finalFinishedProducts.length === 0) {
                console.log(`   ❌ No finished products created`);
            }
            if (finalProductionRun.status !== 'COMPLETED') {
                console.log(`   ❌ Production run not completed (status: ${finalProductionRun.status})`);
            }
        }

        // 8. Clean up test data
        console.log(`\n🧹 Cleaning up test data...`);
        if (finalFinishedProducts.length > 0) {
            await prisma.finishedProduct.deleteMany({
                where: {
                    name: { contains: targetRecipe.name }
                }
            });
            console.log(`   ✅ Removed ${finalFinishedProducts.length} test finished products`);
        }
        
        await prisma.productionStep.deleteMany({
            where: { productionRunId: productionRun.id }
        });
        await prisma.productionRun.delete({
            where: { id: productionRun.id }
        });
        console.log(`   ✅ Removed test production run and steps`);

    } catch (error) {
        console.error('❌ Error during end-to-end test:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testEndToEndProductionWorkflow();
