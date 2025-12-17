#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseContent() {
    try {
        console.log('🔍 Checking database content...\n');

        // Check recipes
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

        console.log(`📋 Recipes found: ${recipes.length}`);
        recipes.forEach(recipe => {
            console.log(`  - ${recipe.name}: ${recipe.ingredients.length} ingredients`);
            recipe.ingredients.forEach(ing => {
                const material = ing.rawMaterial || ing.intermediateProduct;
                console.log(`    * ${material?.name || 'Unknown'}: ${ing.quantity} ${ing.unit}`);
            });
        });

        // Check raw materials
        const rawMaterials = await prisma.rawMaterial.findMany();
        console.log(`\n🥘 Raw Materials: ${rawMaterials.length}`);
        rawMaterials.slice(0, 5).forEach(rm => {
            console.log(`  - ${rm.name}: ${rm.quantity} ${rm.unit} (reserved: ${rm.reservedQuantity || 0})`);
        });

        // Check intermediate products
        const intermediateProducts = await prisma.intermediateProduct.findMany();
        console.log(`\n🍞 Intermediate Products: ${intermediateProducts.length}`);
        intermediateProducts.slice(0, 5).forEach(ip => {
            console.log(`  - ${ip.name}: ${ip.quantity} ${ip.unit} (reserved: ${ip.reservedQuantity || 0})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseContent();
