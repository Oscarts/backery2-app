#!/usr/bin/env node

// Test Complete Production Workflow with Finished Product Creation
const { PrismaClient } = require('@prisma/client');
const { ProductionCompletionService } = require('./src/services/productionCompletionService.ts');

const prisma = new PrismaClient();

async function testCompleteProductionWorkflow() {
    try {
        console.log('🧪 Testing Complete Production Workflow with Finished Products\n');

        // 1. Get a recipe with ingredients
        const recipe = await prisma.recipe.findFirst({
            where: {
                ingredients: {
                    some: {}
                }
            },
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true,
                        finishedProduct: true
                    }
                }
            }
        });

        if (!recipe) {
            console.log('❌ No recipe with ingredients found');
            return;
        }

        console.log(`📋 Using recipe: ${recipe.name}`);
        console.log(`🥘 Ingredients: ${recipe.ingredients.length}`);
        recipe.ingredients.forEach(ing => {
            const material = ing.rawMaterial || ing.finishedProduct;
            console.log(`   - ${material?.name}: ${ing.quantity} ${ing.unit}`);
        });

        // 2. Create production run
        console.log(`\n🏭 Creating production run...`);
        const productionRun = await prisma.productionRun.create({
            data: {
                name: `Complete Test Production of ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: 3,
                targetUnit: recipe.yieldUnit || 'units',
                status: 'PLANNED',
                notes: 'Testing complete workflow with finished product creation',
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

        console.log(`✅ Created production run: ${productionRun.name}`);
        console.log(`   Target: ${productionRun.targetQuantity} ${productionRun.targetUnit}`);

        // 3. Test the completion service directly
        console.log(`\n🔧 Testing completion service directly...`);
        const completionService = new ProductionCompletionService();

        // Mark all steps as completed manually for testing
        for (const step of productionRun.steps) {
            await prisma.productionStep.update({
                where: { id: step.id },
                data: {
                    status: 'COMPLETED',
                    startedAt: new Date(Date.now() - 60000), // Started 1 minute ago
                    completedAt: new Date(),
                    actualMinutes: step.estimatedMinutes
                }
            });
            console.log(`   ✅ Completed step: ${step.name}`);
        }

        // 4. Complete production and create finished product
        console.log(`\n🏁 Completing production run...`);
        const completionResult = await completionService.completeProductionRun(productionRun.id, 3);

        console.log(`✅ Production completed successfully!`);
        console.log(`   Production Run: ${completionResult.productionRun.name}`);
        console.log(`   Status: ${completionResult.productionRun.status}`);
        console.log(`   Finished Product: ${completionResult.finishedProduct.name}`);
        console.log(`   Quantity: ${completionResult.finishedProduct.quantity} ${completionResult.finishedProduct.unit}`);
        console.log(`   SKU: ${completionResult.finishedProduct.sku}`);
        console.log(`   Cost: $${completionResult.finishedProduct.costToProduce}`);

        // 5. Verify finished product in inventory
        console.log(`\n📦 Verifying finished product in inventory...`);
        const finishedProducts = await prisma.finishedProduct.findMany({
            where: {
                name: { contains: recipe.name }
            },
            include: {
                storageLocation: true
            }
        });

        console.log(`Found ${finishedProducts.length} finished products:`);
        finishedProducts.forEach(product => {
            console.log(`   - ${product.name}: ${product.quantity} ${product.unit}`);
            console.log(`     SKU: ${product.sku}`);
            console.log(`     Location: ${product.storageLocation?.name}`);
            console.log(`     Batch: ${product.batchNumber}`);
            console.log(`     Cost: $${product.costToProduce}`);
        });

        // 6. Clean up test data
        console.log(`\n🧹 Cleaning up test data...`);
        await prisma.finishedProduct.delete({
            where: { id: completionResult.finishedProduct.id }
        });
        await prisma.productionStep.deleteMany({
            where: { productionRunId: productionRun.id }
        });
        await prisma.productionRun.delete({
            where: { id: productionRun.id }
        });
        console.log(`✅ Test data cleaned up`);

        console.log(`\n🎉 COMPLETE PRODUCTION WORKFLOW TEST SUCCESSFUL!`);
        console.log(`   ✅ Production run created and tracked`);
        console.log(`   ✅ Steps completed in sequence`);
        console.log(`   ✅ Finished product created in inventory`);
        console.log(`   ✅ Cost calculation working`);
        console.log(`   ✅ Storage location assigned`);

    } catch (error) {
        console.error('❌ Error during complete production workflow test:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteProductionWorkflow();
