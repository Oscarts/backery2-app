const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRecipeUnits() {
  try {
    console.log('🔧 Fixing recipe units to use standardized units...\n');
    
    // Get all valid units
    const validUnits = await prisma.unit.findMany();
    const unitMap = new Map();
    validUnits.forEach(unit => {
      unitMap.set(unit.name.toLowerCase(), unit.name);
      unitMap.set(unit.symbol.toLowerCase(), unit.name);
    });
    
    console.log('Valid units mapping:');
    console.log(Array.from(unitMap.entries()).map(([k,v]) => `  ${k} -> ${v}`).join('\n'));
    
    // Get all recipes with problematic units
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true
      }
    });
    
    console.log(`\nFound ${recipes.length} recipes to check\n`);
    
    let updatedCount = 0;
    
    for (const recipe of recipes) {
      let needsUpdate = false;
      let updates = {};
      
      // Fix yield unit
      if (recipe.yieldUnit) {
        const normalizedYieldUnit = recipe.yieldUnit.toLowerCase();
        if (unitMap.has(normalizedYieldUnit)) {
          const correctUnit = unitMap.get(normalizedYieldUnit);
          if (correctUnit !== recipe.yieldUnit) {
            updates.yieldUnit = correctUnit;
            needsUpdate = true;
            console.log(`Recipe "${recipe.name}": yield unit "${recipe.yieldUnit}" -> "${correctUnit}"`);
          }
        } else {
          // If no mapping found, try to find a reasonable default
          if (normalizedYieldUnit.includes('piece') || normalizedYieldUnit.includes('pc')) {
            updates.yieldUnit = 'Piece';
            needsUpdate = true;
            console.log(`Recipe "${recipe.name}": yield unit "${recipe.yieldUnit}" -> "Piece" (default)`);
          } else if (normalizedYieldUnit.includes('kg') || normalizedYieldUnit.includes('kilogram')) {
            updates.yieldUnit = 'Kilogram';
            needsUpdate = true;
            console.log(`Recipe "${recipe.name}": yield unit "${recipe.yieldUnit}" -> "Kilogram" (default)`);
          } else {
            console.log(`⚠️  Recipe "${recipe.name}": Cannot map yield unit "${recipe.yieldUnit}"`);
          }
        }
      }
      
      // Fix ingredient units
      const ingredientUpdates = [];
      for (const ingredient of recipe.ingredients) {
        if (ingredient.unit) {
          // Handle test units that contain timestamps
          let cleanUnit = ingredient.unit;
          if (/test.*\d{10,}/.test(ingredient.unit)) {
            if (ingredient.unit.includes('kg')) {
              cleanUnit = 'Kilogram';
            } else if (ingredient.unit.includes('g')) {
              cleanUnit = 'Gram';
            } else if (ingredient.unit.includes('l')) {
              cleanUnit = 'Liter';
            } else {
              cleanUnit = 'Piece'; // Default
            }
            ingredientUpdates.push({
              id: ingredient.id,
              unit: cleanUnit
            });
            console.log(`Recipe "${recipe.name}" ingredient: "${ingredient.unit}" -> "${cleanUnit}"`);
          } else {
            const normalizedUnit = ingredient.unit.toLowerCase();
            if (unitMap.has(normalizedUnit)) {
              const correctUnit = unitMap.get(normalizedUnit);
              if (correctUnit !== ingredient.unit) {
                ingredientUpdates.push({
                  id: ingredient.id,
                  unit: correctUnit
                });
                console.log(`Recipe "${recipe.name}" ingredient: "${ingredient.unit}" -> "${correctUnit}"`);
              }
            }
          }
        }
      }
      
      // Update recipe if needed
      if (needsUpdate) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: updates
        });
        updatedCount++;
      }
      
      // Update ingredients if needed
      for (const ingredientUpdate of ingredientUpdates) {
        await prisma.recipeIngredient.update({
          where: { id: ingredientUpdate.id },
          data: { unit: ingredientUpdate.unit }
        });
      }
      
      if (ingredientUpdates.length > 0) {
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} recipes with standardized units`);
    
  } catch (error) {
    console.error('❌ Error fixing recipe units:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRecipeUnits();