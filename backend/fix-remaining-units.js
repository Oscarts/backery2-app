const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRemainingUnits() {
  try {
    console.log('🔧 Fixing remaining invalid recipe units...\n');
    
    // Get invalid recipes and fix them
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { name: 'Test Bread Recipe' },
          { name: 'Mixed Recipe 1759086590491' }
        ]
      },
      include: {
        ingredients: true
      }
    });
    
    for (const recipe of recipes) {
      console.log(`Fixing recipe: "${recipe.name}"`);
      
      let updates = {};
      
      // Fix yield units
      if (recipe.yieldUnit === 'loaf' || recipe.yieldUnit === 'loaves') {
        updates.yieldUnit = 'Piece';  // loaf -> Piece
        console.log(`  Yield unit: "${recipe.yieldUnit}" -> "Piece"`);
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: updates
        });
      }
      
      // Fix ingredient units
      for (const ingredient of recipe.ingredients) {
        let newUnit = null;
        
        if (ingredient.unit === 'liters') {
          newUnit = 'Liter';
        } else if (ingredient.unit === 'pcs') {
          newUnit = 'Piece';
        }
        
        if (newUnit) {
          await prisma.recipeIngredient.update({
            where: { id: ingredient.id },
            data: { unit: newUnit }
          });
          console.log(`  Ingredient unit: "${ingredient.unit}" -> "${newUnit}"`);
        }
      }
      
      console.log(`✅ Fixed recipe: "${recipe.name}"\n`);
    }
    
    console.log('✅ All remaining units fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingUnits();