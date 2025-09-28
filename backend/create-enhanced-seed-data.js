#!/usr/bin/env node

// Enhanced Seed Data for Production Testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEnhancedSeedData() {
    try {
        console.log('🌱 Creating enhanced seed data for production testing...\n');

        // 1. Create suppliers
        console.log('1️⃣ Creating suppliers...');
        let flourSupplier = await prisma.supplier.findFirst({
            where: { name: 'Bakery Supplies Co' }
        });

        if (!flourSupplier) {
            flourSupplier = await prisma.supplier.create({
                data: {
                    name: 'Bakery Supplies Co',
                    contactInfo: 'supplies@bakery.com',
                    address: '123 Baker Street'
                }
            });
        }

        // 2. Create storage locations
        console.log('2️⃣ Creating storage locations...');
        let mainWarehouse = await prisma.storageLocation.findFirst({
            where: { name: 'Main Warehouse' }
        });

        if (!mainWarehouse) {
            mainWarehouse = await prisma.storageLocation.create({
                data: {
                    name: 'Main Warehouse',
                    type: 'WAREHOUSE',
                    description: 'Primary storage for finished products',
                    capacity: '1000 units'
                }
            });
        }

        // 3. Create raw materials
        console.log('3️⃣ Creating raw materials...');

        let flour = await prisma.rawMaterial.findFirst({
            where: { name: 'Premium Bread Flour' }
        });

        if (!flour) {
            flour = await prisma.rawMaterial.create({
                data: {
                    name: 'Premium Bread Flour',
                    description: 'High-quality bread flour',
                    supplierId: flourSupplier.id,
                    batchNumber: 'FLOUR-2025-001',
                    quantity: 500,
                    reservedQuantity: 0,
                    unit: 'kg',
                    unitPrice: 1.50,
                    reorderLevel: 50,
                    storageLocationId: mainWarehouse.id,
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });
        } else {
            await prisma.rawMaterial.update({
                where: { id: flour.id },
                data: { quantity: 500, reservedQuantity: 0 }
            });
        }

        const yeast = await prisma.rawMaterial.upsert({
            where: { name: 'Active Dry Yeast' },
            update: { quantity: 50, reservedQuantity: 0 },
            create: {
                name: 'Active Dry Yeast',
                description: 'Premium active dry yeast',
                supplierId: flourSupplier.id,
                batchNumber: 'YEAST-2025-001',
                quantity: 50,
                reservedQuantity: 0,
                unit: 'kg',
                unitPrice: 8.00,
                reorderLevel: 5,
                storageLocationId: mainWarehouse.id,
                expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            }
        });

        const salt = await prisma.rawMaterial.upsert({
            where: { name: 'Sea Salt' },
            update: { quantity: 100, reservedQuantity: 0 },
            create: {
                name: 'Sea Salt',
                description: 'Fine sea salt',
                supplierId: flourSupplier.id,
                batchNumber: 'SALT-2025-001',
                quantity: 100,
                reservedQuantity: 0,
                unit: 'kg',
                unitPrice: 2.00,
                reorderLevel: 10,
                storageLocationId: mainWarehouse.id,
                expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000)
            }
        });

        const water = await prisma.rawMaterial.upsert({
            where: { name: 'Filtered Water' },
            update: { quantity: 1000, reservedQuantity: 0 },
            create: {
                name: 'Filtered Water',
                description: 'Clean filtered water',
                supplierId: flourSupplier.id,
                batchNumber: 'WATER-2025-001',
                quantity: 1000,
                reservedQuantity: 0,
                unit: 'liters',
                unitPrice: 0.01,
                reorderLevel: 100,
                storageLocationId: mainWarehouse.id,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // 4. Create recipes with ingredients
        console.log('4️⃣ Creating recipes with ingredients...');

        // Clean up existing recipe ingredients
        await prisma.recipeIngredient.deleteMany({
            where: {
                recipe: {
                    name: { in: ['Classic Sourdough Bread', 'Simple White Bread'] }
                }
            }
        });

        // Delete and recreate recipes
        await prisma.recipe.deleteMany({
            where: {
                name: { in: ['Classic Sourdough Bread', 'Simple White Bread'] }
            }
        });

        const sourdoughRecipe = await prisma.recipe.create({
            data: {
                name: 'Classic Sourdough Bread',
                description: 'Traditional sourdough bread with crispy crust',
                yieldQuantity: 2,
                yieldUnit: 'loaf',
                prepTime: 480, // 8 hours including rising
                cookTime: 45,
                estimatedTotalTime: 525,
                difficulty: 'MEDIUM',
                instructions: [
                    'Mix flour, water, and salt',
                    'Add sourdough starter',
                    'Knead for 10 minutes',
                    'First rise for 4 hours',
                    'Shape loaves',
                    'Final rise for 2 hours',
                    'Bake at 450°F for 45 minutes'
                ],
                emoji: '🍞',
                category: 'Artisan Breads'
            }
        });

        // Add ingredients to sourdough recipe
        await prisma.recipeIngredient.createMany({
            data: [
                {
                    recipeId: sourdoughRecipe.id,
                    rawMaterialId: flour.id,
                    quantity: 1.5,
                    unit: 'kg'
                },
                {
                    recipeId: sourdoughRecipe.id,
                    rawMaterialId: water.id,
                    quantity: 1.0,
                    unit: 'liters'
                },
                {
                    recipeId: sourdoughRecipe.id,
                    rawMaterialId: salt.id,
                    quantity: 0.03,
                    unit: 'kg'
                },
                {
                    recipeId: sourdoughRecipe.id,
                    rawMaterialId: yeast.id,
                    quantity: 0.01,
                    unit: 'kg'
                }
            ]
        });

        const whiteBreadRecipe = await prisma.recipe.create({
            data: {
                name: 'Simple White Bread',
                description: 'Soft and fluffy white bread perfect for sandwiches',
                yieldQuantity: 1,
                yieldUnit: 'loaf',
                prepTime: 180, // 3 hours including rising
                cookTime: 35,
                estimatedTotalTime: 215,
                difficulty: 'EASY',
                instructions: [
                    'Mix flour, water, yeast, and salt',
                    'Knead for 8 minutes',
                    'First rise for 1.5 hours',
                    'Shape into loaf',
                    'Final rise for 1 hour',
                    'Bake at 375°F for 35 minutes'
                ],
                emoji: '🍞',
                category: 'Basic Breads'
            }
        });

        // Add ingredients to white bread recipe
        await prisma.recipeIngredient.createMany({
            data: [
                {
                    recipeId: whiteBreadRecipe.id,
                    rawMaterialId: flour.id,
                    quantity: 0.5,
                    unit: 'kg'
                },
                {
                    recipeId: whiteBreadRecipe.id,
                    rawMaterialId: water.id,
                    quantity: 0.32,
                    unit: 'liters'
                },
                {
                    recipeId: whiteBreadRecipe.id,
                    rawMaterialId: salt.id,
                    quantity: 0.01,
                    unit: 'kg'
                },
                {
                    recipeId: whiteBreadRecipe.id,
                    rawMaterialId: yeast.id,
                    quantity: 0.007,
                    unit: 'kg'
                }
            ]
        });

        console.log('✅ Enhanced seed data created successfully!');
        // Create a finished product to demonstrate mixed recipe ingredients
        let frostingBase = await prisma.finishedProduct.findFirst({ where: { name: 'Simple Frosting Base' } });
        if (!frostingBase) {
            frostingBase = await prisma.finishedProduct.create({
                data: {
                    name: 'Simple Frosting Base',
                    sku: `FROST-${Date.now()}`,
                    batchNumber: 'FROST-BASE-001',
                    productionDate: new Date(),
                    expirationDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                    shelfLife: 21,
                    quantity: 50,
                    unit: 'kg',
                    salePrice: 0,
                    costToProduce: 75,
                    status: 'IN_PROGRESS'
                }
            });
        }

        // Mixed recipe using both raw materials and a finished product as ingredient
        const mixedRecipeName = 'Decorated Bread Loaf';
        await prisma.recipe.deleteMany({ where: { name: mixedRecipeName } });
        const mixedRecipe = await prisma.recipe.create({
            data: {
                name: mixedRecipeName,
                description: 'White bread loaf with frosting decoration (demonstrates mixed ingredients)',
                yieldQuantity: 1,
                yieldUnit: 'loaf',
                prepTime: 190,
                cookTime: 35,
                difficulty: 'EASY',
                instructions: [
                    'Prepare dough base',
                    'Bake loaf',
                    'Cool and apply frosting decoration'
                ],
                emoji: '🎂',
                category: 'Decorated Products'
            }
        });

        await prisma.recipeIngredient.createMany({
            data: [
                { recipeId: mixedRecipe.id, rawMaterialId: flour.id, quantity: 0.5, unit: 'kg' },
                { recipeId: mixedRecipe.id, rawMaterialId: water.id, quantity: 0.3, unit: 'liters' },
                { recipeId: mixedRecipe.id, rawMaterialId: yeast.id, quantity: 0.005, unit: 'kg' },
                { recipeId: mixedRecipe.id, finishedProductId: frostingBase.id, quantity: 0.75, unit: 'kg' }
            ]
        });

        console.log('   - Mixed Recipe: 1 (Decorated Bread Loaf with frosting base)');
        console.log(`\n📋 Summary:`);
        console.log(`   - Suppliers: 1 (${flourSupplier.name})`);
        console.log(`   - Storage Locations: 1 (${mainWarehouse.name})`);
        console.log(`   - Raw Materials: 4 (flour, yeast, salt, water)`);
        console.log(`   - Recipes: 2 (sourdough, white bread)`);
        console.log(`   - Recipe Ingredients: 8 total`);

        // Verify the data
        const recipeCheck = await prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true
                    }
                }
            }
        });

        console.log(`\n🔍 Recipe verification:`);
        recipeCheck.forEach(recipe => {
            console.log(`   - ${recipe.name} (${recipe.yieldQuantity} ${recipe.yieldUnit})`);
            recipe.ingredients.forEach(ing => {
                console.log(`     * ${ing.rawMaterial?.name}: ${ing.quantity} ${ing.unit}`);
            });
        });

    } catch (error) {
        console.error('❌ Error creating enhanced seed data:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

createEnhancedSeedData();
