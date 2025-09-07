#!/usr/bin/env node

// Simple seed data creation for production testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleSeedData() {
    try {
        console.log('🌱 Creating simple seed data for production testing...\n');

        // Get or create supplier
        let supplier = await prisma.supplier.findFirst();
        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: {
                    name: 'Bakery Supplies Co',
                    contactInfo: 'supplies@bakery.com',
                    address: '123 Baker Street'
                }
            });
        }

        // Get storage location
        let warehouse = await prisma.storageLocation.findFirst({
            where: { type: 'WAREHOUSE' }
        });
        if (!warehouse) {
            warehouse = await prisma.storageLocation.create({
                data: {
                    name: 'Main Warehouse',
                    type: 'WAREHOUSE',
                    description: 'Primary storage for finished products',
                    capacity: '1000 units'
                }
            });
        }

        // Create raw materials if they don't exist
        let flour = await prisma.rawMaterial.findFirst({
            where: { name: { contains: 'Flour' } }
        });
        
        if (!flour) {
            flour = await prisma.rawMaterial.create({
                data: {
                    name: 'Premium Bread Flour',
                    description: 'High-quality bread flour',
                    supplierId: supplier.id,
                    batchNumber: 'FLOUR-001',
                    quantity: 100,
                    reservedQuantity: 0,
                    unit: 'kg',
                    unitPrice: 1.50,
                    reorderLevel: 10,
                    storageLocationId: warehouse.id,
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });
        }

        let water = await prisma.rawMaterial.findFirst({
            where: { name: { contains: 'Water' } }
        });
        
        if (!water) {
            water = await prisma.rawMaterial.create({
                data: {
                    name: 'Filtered Water',
                    description: 'Clean filtered water',
                    supplierId: supplier.id,
                    batchNumber: 'WATER-001',
                    quantity: 200,
                    reservedQuantity: 0,
                    unit: 'liters',
                    unitPrice: 0.01,
                    reorderLevel: 20,
                    storageLocationId: warehouse.id,
                    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
        }

        // Create a complete recipe
        let breadRecipe = await prisma.recipe.findFirst({
            where: { name: 'Simple Artisan Bread' }
        });

        if (!breadRecipe) {
            breadRecipe = await prisma.recipe.create({
                data: {
                    name: 'Simple Artisan Bread',
                    description: 'Delicious artisan bread perfect for bakery production',
                    yieldQuantity: 2,
                    yieldUnit: 'loaf',
                    prepTime: 240, // 4 hours
                    cookTime: 45,
                    estimatedTotalTime: 285,
                    difficulty: 'MEDIUM',
                    instructions: [
                        'Mix flour and water to form dough',
                        'Knead for 10 minutes until smooth',
                        'First rise for 2 hours',
                        'Shape into loaves',
                        'Final rise for 1 hour',
                        'Bake at 425°F for 45 minutes'
                    ],
                    emoji: '🍞'
                }
            });

            // Add ingredients to the recipe
            await prisma.recipeIngredient.createMany({
                data: [
                    {
                        recipeId: breadRecipe.id,
                        rawMaterialId: flour.id,
                        quantity: 1.0,
                        unit: 'kg'
                    },
                    {
                        recipeId: breadRecipe.id,
                        rawMaterialId: water.id,
                        quantity: 0.65,
                        unit: 'liters'
                    }
                ]
            });

            console.log('✅ Created recipe with ingredients');
        }

        console.log('✅ Simple seed data ready!');
        console.log(`\n📋 Data summary:`);
        console.log(`   - Supplier: ${supplier.name}`);
        console.log(`   - Storage: ${warehouse.name}`);
        console.log(`   - Raw Materials: ${flour.name}, ${water.name}`);
        console.log(`   - Recipe: ${breadRecipe.name} (${breadRecipe.yieldQuantity} ${breadRecipe.yieldUnit})`);

        // Verify ingredients
        const recipeWithIngredients = await prisma.recipe.findUnique({
            where: { id: breadRecipe.id },
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true
                    }
                }
            }
        });

        console.log(`\n🥘 Recipe ingredients:`);
        recipeWithIngredients.ingredients.forEach(ing => {
            console.log(`   - ${ing.rawMaterial.name}: ${ing.quantity} ${ing.unit}`);
        });

    } catch (error) {
        console.error('❌ Error creating seed data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSimpleSeedData();
