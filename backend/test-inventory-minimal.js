#!/usr/bin/env node

// Minimal test for inventory service
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function minimalTest() {
    try {
        console.log('🧪 Minimal Inventory Service Test\n');

        // First create required dependencies
        console.log('1️⃣ Creating test data...');

        // Create supplier
        const supplier = await prisma.supplier.create({
            data: {
                name: 'Test Supplier',
                contactInfo: 'test@supplier.com',
                address: 'Test Address'
            }
        });

        // Create storage location
        const location = await prisma.storageLocation.create({
            data: {
                name: 'Test Storage',
                description: 'Test storage location',
                type: 'WAREHOUSE',
                capacity: '1000kg'
            }
        });

        // Create raw materials
        const flour = await prisma.rawMaterial.create({
            data: {
                name: 'Test Flour',
                description: 'Test flour for baking',
                supplierId: supplier.id,
                batchNumber: 'FL-001',
                quantity: 100,
                reservedQuantity: 0,
                unit: 'kg',
                unitPrice: 2.50,
                reorderLevel: 10,
                storageLocationId: location.id,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        const water = await prisma.rawMaterial.create({
            data: {
                name: 'Test Water',
                description: 'Clean water',
                supplierId: supplier.id,
                batchNumber: 'W-001',
                quantity: 50,
                reservedQuantity: 0,
                unit: 'liters',
                unitPrice: 0.01,
                reorderLevel: 5,
                storageLocationId: location.id,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        console.log(`✅ Created: ${flour.name} (${flour.quantity} ${flour.unit})`);
        console.log(`✅ Created: ${water.name} (${water.quantity} ${water.unit})`);

        // Create a recipe
        console.log('\n2️⃣ Creating test recipe...');
        const recipe = await prisma.recipe.create({
            data: {
                name: 'Test Bread Recipe',
                description: 'Simple bread recipe for testing',
                instructions: ['Mix flour and water', 'Knead', 'Bake'],
                yieldQuantity: 1,
                yieldUnit: 'loaf',
                prepTime: 30,
                cookTime: 45,
                estimatedTotalTime: 75,
                difficulty: 'EASY'
            }
        });

        // Add ingredients to recipe
        const ingredient1 = await prisma.recipeIngredient.create({
            data: {
                recipeId: recipe.id,
                rawMaterialId: flour.id,
                quantity: 2,
                unit: 'kg'
            }
        });

        const ingredient2 = await prisma.recipeIngredient.create({
            data: {
                recipeId: recipe.id,
                rawMaterialId: water.id,
                quantity: 1.2,
                unit: 'liters'
            }
        });

        console.log(`✅ Created recipe: ${recipe.name}`);
        console.log(`   - ${ingredient1.quantity} ${ingredient1.unit} flour`);
        console.log(`   - ${ingredient2.quantity} ${ingredient2.unit} water`);

        // Test the inventory service
        console.log('\n3️⃣ Testing ProductionInventoryService...');

        const { ProductionInventoryService } = require('./src/services/productionInventoryService.ts');
        const inventoryService = new ProductionInventoryService();

        // Test availability check
        const availability = await inventoryService.checkIngredientAvailability(recipe.id, 1);
        console.log(`✅ Can produce: ${availability.canProduce}`);
        console.log(`📋 Ingredients checked: ${availability.checks.length}`);

        availability.checks.forEach(check => {
            const status = check.sufficient ? '✅' : '❌';
            console.log(`   ${status} ${check.materialName}: need ${check.required}, have ${check.available} ${check.unit}`);
        });

        if (availability.insufficientIngredients.length > 0) {
            console.log('\n⚠️  Insufficient ingredients:');
            availability.insufficientIngredients.forEach(ing => {
                console.log(`   - ${ing.materialName}: shortage of ${ing.shortage} ${ing.unit}`);
            });
        }

        // Test allocation if possible
        if (availability.canProduce) {
            console.log('\n4️⃣ Testing allocation...');

            // Create a production run
            const productionRun = await prisma.productionRun.create({
                data: {
                    name: `Production of ${recipe.name}`,
                    batchNumber: `TEST-${Date.now()}`,
                    recipeId: recipe.id,
                    targetQuantity: 1,
                    targetUnit: recipe.yieldUnit,
                    plannedQuantity: 1,
                    actualQuantity: 0,
                    unit: recipe.yieldUnit,
                    status: 'PENDING',
                    priority: 'NORMAL',
                    notes: 'Test production run'
                }
            });

            // Test allocation
            const allocations = await inventoryService.allocateIngredients(productionRun.id, recipe.id, 1);
            console.log(`✅ Allocated ${allocations.length} ingredients`);

            // Check allocation records
            const allocationRecords = await prisma.productionAllocation.findMany({
                where: { productionRunId: productionRun.id }
            });

            allocationRecords.forEach(record => {
                console.log(`   - ${record.materialName}: ${record.quantityAllocated} ${record.unit} (${record.status})`);
            });

            // Clean up test allocation
            await inventoryService.releaseAllocatedIngredients(productionRun.id);
            await prisma.productionRun.delete({ where: { id: productionRun.id } });
            console.log('✅ Test allocation cleaned up');
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
        await prisma.recipe.delete({ where: { id: recipe.id } });
        await prisma.rawMaterial.deleteMany({ where: { supplierId: supplier.id } });
        await prisma.storageLocation.delete({ where: { id: location.id } });
        await prisma.supplier.delete({ where: { id: supplier.id } });

        console.log('\n🎉 Inventory service test completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

minimalTest();
