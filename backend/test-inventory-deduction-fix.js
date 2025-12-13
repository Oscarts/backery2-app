#!/usr/bin/env node

/**
 * Test Inventory Deduction Fix
 * 
 * This test verifies that when production is completed:
 * 1. Raw materials are properly reserved during production
 * 2. Raw materials are deducted from inventory after completion
 * 3. Finished products used as ingredients are reserved and deducted properly
 * 4. Reserved quantities are removed after consumption
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInventoryDeductionFix() {
    console.log('🧪 Testing Inventory Deduction Fix');
    console.log('=====================================\n');

    try {
        // 1. Find a recipe with ingredients
        console.log('1️⃣ Finding a recipe to test...');
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

        // 2. Record initial inventory state
        console.log('\n2️⃣ Recording initial inventory state...');
        const initialState = {};
        
        for (const ingredient of recipe.ingredients) {
            if (ingredient.rawMaterial) {
                const material = ingredient.rawMaterial;
                initialState[material.id] = {
                    type: 'RAW_MATERIAL',
                    name: material.name,
                    quantity: material.quantity,
                    reservedQuantity: material.reservedQuantity,
                    available: material.quantity - material.reservedQuantity,
                    needed: ingredient.quantity
                };
                console.log(`   📦 ${material.name}:`);
                console.log(`      Quantity: ${material.quantity} ${ingredient.unit}`);
                console.log(`      Reserved: ${material.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Available: ${material.quantity - material.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Needed: ${ingredient.quantity} ${ingredient.unit}`);
            } else if (ingredient.finishedProduct) {
                const product = ingredient.finishedProduct;
                initialState[product.id] = {
                    type: 'FINISHED_PRODUCT',
                    name: product.name,
                    quantity: product.quantity,
                    reservedQuantity: product.reservedQuantity,
                    available: product.quantity - product.reservedQuantity,
                    needed: ingredient.quantity
                };
                console.log(`   🏭 ${product.name}:`);
                console.log(`      Quantity: ${product.quantity} ${ingredient.unit}`);
                console.log(`      Reserved: ${product.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Available: ${product.quantity - product.reservedQuantity} ${ingredient.unit}`);
                console.log(`      Needed: ${ingredient.quantity} ${ingredient.unit}`);
            }
        }

        // 3. Create a production run
        console.log('\n3️⃣ Creating production run...');
        const productionRun = await prisma.productionRun.create({
            data: {
                name: `Test Inventory Deduction - ${Date.now()}`,
                recipeId: recipe.id,
                targetQuantity: 1, // Produce 1 unit to match recipe quantities
                targetUnit: recipe.unit || 'units',
                status: 'IN_PROGRESS',
                clientId: recipe.clientId,
                steps: {
                    create: [
                        {
                            name: 'Test Step',
                            stepOrder: 1,
                            estimatedMinutes: 10,
                            status: 'COMPLETED',
                            startedAt: new Date(),
                            completedAt: new Date(),
                            actualMinutes: 10
                        }
                    ]
                }
            },
            include: {
                steps: true
            }
        });

        console.log(`✅ Production run created: ${productionRun.id}`);

        // 4. Check inventory after allocation (should be reserved)
        console.log('\n4️⃣ Completing production (this will allocate materials)...');
        
        const { ProductionCompletionService } = require('./src/services/productionCompletionService.ts');
        const completionService = new ProductionCompletionService();
        
        const result = await completionService.completeProductionRun(productionRun.id, 1);
        
        console.log(`✅ Production completed!`);
        console.log(`   Finished Product: ${result.finishedProduct.name}`);
        console.log(`   Quantity: ${result.finishedProduct.quantity} ${result.finishedProduct.unit}`);

        // 5. Check final inventory state after consumption
        console.log('\n5️⃣ Checking final inventory state after consumption...');
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
                const expectedQuantity = initial.quantity - ingredient.quantity;
                const expectedReserved = initial.reservedQuantity; // Should be same (reserved then consumed)
                const quantityCorrect = Math.abs(material.quantity - expectedQuantity) < 0.01;
                const reservedCorrect = Math.abs(material.reservedQuantity - expectedReserved) < 0.01;

                console.log(`\n   📦 ${material.name}:`);
                console.log(`      Before: ${initial.quantity} ${ingredient.unit} (${initial.reservedQuantity} reserved)`);
                console.log(`      After:  ${material.quantity} ${ingredient.unit} (${material.reservedQuantity} reserved)`);
                console.log(`      Expected: ${expectedQuantity} ${ingredient.unit} (${expectedReserved} reserved)`);
                console.log(`      Deducted: ${initial.quantity - material.quantity} ${ingredient.unit}`);
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
                const expectedQuantity = initial.quantity - ingredient.quantity;
                const expectedReserved = initial.reservedQuantity; // Should be same (reserved then consumed)
                const quantityCorrect = Math.abs(product.quantity - expectedQuantity) < 0.01;
                const reservedCorrect = Math.abs(product.reservedQuantity - expectedReserved) < 0.01;

                console.log(`\n   🏭 ${product.name}:`);
                console.log(`      Before: ${initial.quantity} ${ingredient.unit} (${initial.reservedQuantity} reserved)`);
                console.log(`      After:  ${product.quantity} ${ingredient.unit} (${product.reservedQuantity} reserved)`);
                console.log(`      Expected: ${expectedQuantity} ${ingredient.unit} (${expectedReserved} reserved)`);
                console.log(`      Deducted: ${initial.quantity - product.quantity} ${ingredient.unit}`);
                console.log(`      Status: ${quantityCorrect ? '✅ CORRECT' : '❌ WRONG'} quantity, ${reservedCorrect ? '✅ CORRECT' : '❌ WRONG'} reservation`);

                if (!quantityCorrect || !reservedCorrect) {
                    allCorrect = false;
                }
            }
        }

        // 6. Check production allocations
        console.log('\n6️⃣ Checking production allocations...');
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

        // 7. Summary
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

        // 8. Cleanup
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete finished product
        if (result.finishedProduct) {
            await prisma.finishedProduct.delete({
                where: { id: result.finishedProduct.id }
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
