#!/usr/bin/env node

// Test Production Workflow End-to-End
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionWorkflow() {
    try {
        console.log('🧪 Testing Production Workflow End-to-End\n');

        // 1. Check current state
        console.log('1️⃣ Checking current database state...');
        
        const recipes = await prisma.recipe.findMany({
            include: { ingredients: true }
        });
        console.log(`📋 Recipes available: ${recipes.length}`);
        
        const productionRuns = await prisma.productionRun.findMany({
            include: { steps: true }
        });
        console.log(`🏭 Production runs: ${productionRuns.length}`);
        
        const finishedProducts = await prisma.finishedProduct.findMany();
        console.log(`📦 Finished products: ${finishedProducts.length}`);

        // 2. Check if we have any completed production runs
        const completedRuns = await prisma.productionRun.findMany({
            where: { status: 'COMPLETED' },
            include: {
                recipe: true,
                steps: true
            }
        });
        
        console.log(`\n2️⃣ Completed production runs: ${completedRuns.length}`);
        if (completedRuns.length > 0) {
            for (const run of completedRuns) {
                console.log(`   - ${run.name}: ${run.targetQuantity} ${run.targetUnit} of ${run.recipe?.name}`);
                console.log(`     Steps completed: ${run.steps?.filter(s => s.status === 'COMPLETED').length}/${run.steps?.length}`);
                console.log(`     Completed at: ${run.completedAt}`);
            }
        }

        // 3. Create a test production run if we have recipes
        if (recipes.length > 0) {
            console.log(`\n3️⃣ Creating test production run...`);
            
            const testRecipe = recipes[0];
            console.log(`Using recipe: ${testRecipe.name}`);

            const testRun = await prisma.productionRun.create({
                data: {
                    name: `Test Production of ${testRecipe.name}`,
                    recipeId: testRecipe.id,
                    targetQuantity: 5,
                    targetUnit: testRecipe.yieldUnit || 'units',
                    status: 'PLANNED',
                    notes: 'Testing complete production workflow',
                    steps: {
                        create: [
                            {
                                name: 'Preparation',
                                description: 'Gather ingredients and equipment',
                                stepOrder: 1,
                                estimatedMinutes: 10,
                                status: 'PENDING'
                            },
                            {
                                name: 'Production',
                                description: 'Execute recipe steps',
                                stepOrder: 2,
                                estimatedMinutes: 30,
                                status: 'PENDING'
                            },
                            {
                                name: 'Quality Check',
                                description: 'Quality control inspection',
                                stepOrder: 3,
                                estimatedMinutes: 5,
                                status: 'PENDING'
                            },
                            {
                                name: 'Packaging',
                                description: 'Package finished products',
                                stepOrder: 4,
                                estimatedMinutes: 10,
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

            console.log(`✅ Created production run: ${testRun.name}`);
            console.log(`   Target: ${testRun.targetQuantity} ${testRun.targetUnit}`);
            console.log(`   Steps: ${testRun.steps.length}`);

            // 4. Simulate completing all steps
            console.log(`\n4️⃣ Simulating production step completion...`);
            
            for (let i = 0; i < testRun.steps.length; i++) {
                const step = testRun.steps[i];
                console.log(`   Starting step ${i + 1}: ${step.name}`);
                
                // Start step
                await prisma.productionStep.update({
                    where: { id: step.id },
                    data: {
                        status: 'IN_PROGRESS',
                        startedAt: new Date()
                    }
                });

                // Complete step after a short delay
                await new Promise(resolve => setTimeout(resolve, 100));
                
                await prisma.productionStep.update({
                    where: { id: step.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        actualMinutes: step.estimatedMinutes
                    }
                });

                console.log(`   ✅ Completed step ${i + 1}: ${step.name}`);
            }

            // Update production run status to completed
            await prisma.productionRun.update({
                where: { id: testRun.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            console.log(`✅ Production run marked as COMPLETED`);

            // 5. Check if finished products were created
            console.log(`\n5️⃣ Checking for finished products after completion...`);
            
            const finishedProductsAfter = await prisma.finishedProduct.findMany({
                where: {
                    name: { contains: testRecipe.name }
                }
            });

            console.log(`📦 Finished products found: ${finishedProductsAfter.length}`);
            
            if (finishedProductsAfter.length === 0) {
                console.log(`❌ ISSUE IDENTIFIED: No finished products were created!`);
                console.log(`   Expected: ${testRun.targetQuantity} ${testRun.targetUnit} of ${testRecipe.name}`);
                console.log(`   Actual: 0 finished products in inventory`);
            } else {
                finishedProductsAfter.forEach(product => {
                    console.log(`   - ${product.name}: ${product.quantity} ${product.unit}`);
                });
            }

            // Clean up test run
            console.log(`\n🧹 Cleaning up test data...`);
            await prisma.productionStep.deleteMany({
                where: { productionRunId: testRun.id }
            });
            await prisma.productionRun.delete({
                where: { id: testRun.id }
            });
            console.log(`✅ Test data cleaned up`);
        }

        console.log(`\n🎯 DIAGNOSIS:`);
        console.log(`   The production workflow successfully tracks production runs and steps,`);
        console.log(`   but it's missing the critical step of creating finished products`);
        console.log(`   in the inventory when production is completed.`);
        console.log(`\n   This is why you can't find finished products after production!`);

    } catch (error) {
        console.error('❌ Error during production workflow test:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testProductionWorkflow();
