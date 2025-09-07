#!/usr/bin/env node

// Test Inventory Integration Service
const { PrismaClient } = require('@prisma/client');
const { productionInventoryService } = require('./src/services/productionInventoryService.ts');

const prisma = new PrismaClient();

async function testInventoryIntegration() {
    try {
        console.log('🔧 Testing Production Inventory Integration...\n');

        const inventoryService = productionInventoryService;

        // Get first recipe for testing
        const recipe = await prisma.recipe.findFirst({
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true,
                        intermediateProduct: true
                    }
                }
            }
        });

        if (!recipe) {
            console.log('❌ No recipes found in database');
            return;
        }

        console.log(`📋 Testing with recipe: ${recipe.name}`);
        console.log(`🧾 Ingredients: ${recipe.ingredients.length}`);

        // Test 1: Check ingredient availability
        console.log('\n1️⃣ Testing ingredient availability check...');
        const availability = await inventoryService.checkIngredientAvailability(recipe.id, 1);
        
        console.log(`✅ Can produce: ${availability.canProduce}`);
        console.log(`📊 Checks: ${availability.checks.length}`);
        
        if (availability.insufficientIngredients.length > 0) {
            console.log(`⚠️  Insufficient ingredients: ${availability.insufficientIngredients.length}`);
            availability.insufficientIngredients.forEach(ing => {
                console.log(`   - ${ing.materialName}: need ${ing.required}, have ${ing.available} (shortage: ${ing.shortage})`);
            });
        }

        // Test 2: Create a test production run
        console.log('\n2️⃣ Creating test production run...');
        const testRun = await prisma.productionRun.create({
            data: {
                name: `Test Production of ${recipe.name}`,
                batchNumber: `TEST-${Date.now()}`,
                recipeId: recipe.id,
                plannedQuantity: 1,
                actualQuantity: 0,
                unit: recipe.unit || 'units',
                status: 'PENDING',
                priority: 'NORMAL',
                notes: 'Test run for inventory integration'
            }
        });

        console.log(`✅ Created test production run: ${testRun.batchNumber}`);

        // Test 3: Try allocation if possible
        if (availability.canProduce) {
            console.log('\n3️⃣ Testing ingredient allocation...');
            const allocations = await inventoryService.allocateIngredients(testRun.id, recipe.id, 1);
            console.log(`✅ Allocated ${allocations.length} ingredients`);

            // Test 4: Check allocation records
            console.log('\n4️⃣ Checking allocation records...');
            const allocationRecords = await prisma.productionAllocation.findMany({
                where: { productionRunId: testRun.id }
            });
            console.log(`📋 Found ${allocationRecords.length} allocation records`);

            allocationRecords.forEach(record => {
                console.log(`   - ${record.materialName}: ${record.quantityAllocated} ${record.unit} (${record.status})`);
            });

            // Test 5: Release allocations (cleanup)
            console.log('\n5️⃣ Releasing allocations (cleanup)...');
            await inventoryService.releaseAllocatedIngredients(testRun.id);
            console.log('✅ Allocations released');
        } else {
            console.log('\n⚠️  Skipping allocation test - insufficient ingredients');
        }

        // Clean up test run
        console.log('\n🧹 Cleaning up test data...');
        await prisma.productionAllocation.deleteMany({
            where: { productionRunId: testRun.id }
        });
        await prisma.productionRun.delete({
            where: { id: testRun.id }
        });
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Inventory integration test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing inventory integration:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testInventoryIntegration();
