#!/usr/bin/env node

// Simple test with existing data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
    try {
        console.log('🧪 Quick Inventory Service Test\n');

        // Add some raw materials for testing
        console.log('1️⃣ Adding test raw materials...');

        const flour = await prisma.rawMaterial.upsert({
            where: { name: 'All-Purpose Flour' },
            update: { quantity: 1000, reservedQuantity: 0 },
            create: {
                name: 'All-Purpose Flour',
                description: 'White all-purpose flour',
                categoryId: null,
                supplierId: 'test-supplier',
                batchNumber: 'FL-001',
                quantity: 1000,
                reservedQuantity: 0,
                unit: 'kg',
                storageLocationId: 'test-location',
                costPerUnit: 2.50,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        const water = await prisma.rawMaterial.upsert({
            where: { name: 'Water' },
            update: { quantity: 500, reservedQuantity: 0 },
            create: {
                name: 'Water',
                description: 'Clean water',
                categoryId: null,
                supplierId: 'test-supplier',
                batchNumber: 'W-001',
                quantity: 500,
                reservedQuantity: 0,
                unit: 'liters',
                storageLocationId: 'test-location',
                costPerUnit: 0.01,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        console.log(`✅ Created: ${flour.name} (${flour.quantity} ${flour.unit})`);
        console.log(`✅ Created: ${water.name} (${water.quantity} ${water.unit})`);

        // Get existing recipe
        const recipe = await prisma.recipe.findFirst();
        if (!recipe) {
            console.log('❌ No recipe found');
            return;
        }

        console.log(`\n2️⃣ Using recipe: ${recipe.name}`);

        // Add ingredients to the recipe
        console.log('3️⃣ Adding ingredients to recipe...');

        await prisma.recipeIngredient.deleteMany({
            where: { recipeId: recipe.id }
        });

        const ingredient1 = await prisma.recipeIngredient.create({
            data: {
                recipeId: recipe.id,
                rawMaterialId: flour.id,
                quantity: 5,
                unit: 'kg'
            }
        });

        const ingredient2 = await prisma.recipeIngredient.create({
            data: {
                recipeId: recipe.id,
                rawMaterialId: water.id,
                quantity: 3,
                unit: 'liters'
            }
        });

        console.log(`✅ Added ${ingredient1.quantity} ${ingredient1.unit} of flour`);
        console.log(`✅ Added ${ingredient2.quantity} ${ingredient2.unit} of water`);

        // Test the inventory service
        console.log('\n4️⃣ Testing ProductionInventoryService...');

        // Import the service (require works better with ts files in node)
        const { ProductionInventoryService } = require('./src/services/productionInventoryService.ts');
        const inventoryService = new ProductionInventoryService();

        // Test availability check
        const availability = await inventoryService.checkIngredientAvailability(recipe.id, 1);
        console.log(`✅ Can produce: ${availability.canProduce}`);
        console.log(`📋 Ingredients checked: ${availability.checks.length}`);

        availability.checks.forEach(check => {
            console.log(`   - ${check.materialName}: need ${check.required}, have ${check.available} ${check.unit} ✅`);
        });

        if (availability.insufficientIngredients.length > 0) {
            console.log('\n⚠️  Insufficient ingredients:');
            availability.insufficientIngredients.forEach(ing => {
                console.log(`   - ${ing.materialName}: shortage of ${ing.shortage} ${ing.unit}`);
            });
        }

        console.log('\n🎉 Inventory service test completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

quickTest();
