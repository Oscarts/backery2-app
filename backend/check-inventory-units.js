const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInventoryUnits() {
  try {
    console.log('Checking existing inventory items for unit issues...');
    
    // Get all valid unit symbols
    const validUnits = await prisma.unit.findMany({ where: { isActive: true } });
    const validUnitSymbols = validUnits.map(u => u.symbol);
    console.log('Valid unit symbols:', validUnitSymbols.join(', '));
    
    // Check raw materials
    const rawMaterials = await prisma.rawMaterial.findMany({
      select: { id: true, name: true, unit: true, sku: true }
    });
    
    console.log(`\nFound ${rawMaterials.length} raw materials`);
    const invalidRawMaterials = rawMaterials.filter(rm => 
      rm.unit && !validUnitSymbols.includes(rm.unit) && !/\d{10,}/.test(rm.unit)
    );
    
    if (invalidRawMaterials.length > 0) {
      console.log('Raw materials with invalid units:');
      invalidRawMaterials.forEach(rm => {
        console.log(`  - ${rm.name}: ${rm.unit}`);
      });
    } else {
      console.log('✓ All raw materials have valid units or unit fields to be cleaned');
    }
    
    // Check finished products
    const finishedProducts = await prisma.finishedProduct.findMany({
      select: { id: true, name: true, unit: true, sku: true }
    });
    
    console.log(`\nFound ${finishedProducts.length} finished products`);
    const invalidFinishedProducts = finishedProducts.filter(fp => 
      fp.unit && !validUnitSymbols.includes(fp.unit) && !/\d{10,}/.test(fp.unit)
    );
    
    if (invalidFinishedProducts.length > 0) {
      console.log('Finished products with invalid units:');
      invalidFinishedProducts.forEach(fp => {
        console.log(`  - ${fp.name}: ${fp.unit}`);
      });
    } else {
      console.log('✓ All finished products have valid units or unit fields to be cleaned');
    }
    
    // Check recipes
    const recipes = await prisma.recipe.findMany({
      select: { 
        id: true, 
        name: true, 
        yieldUnit: true,
        ingredients: {
          select: { 
            id: true,
            unit: true,
            ingredientType: true,
            rawMaterial: { select: { name: true } },
            finishedProduct: { select: { name: true } }
          }
        }
      }
    });
    
    console.log(`\nFound ${recipes.length} recipes`);
    let recipeIssues = [];
    
    recipes.forEach(recipe => {
      // Check recipe yield unit
      if (recipe.yieldUnit && !validUnitSymbols.includes(recipe.yieldUnit)) {
        // Check if it's a unit name instead of symbol
        const matchingUnit = validUnits.find(u => u.name === recipe.yieldUnit);
        if (!matchingUnit) {
          recipeIssues.push(`Recipe "${recipe.name}": invalid yield unit "${recipe.yieldUnit}"`);
        }
      }
      
      // Check ingredient units
      recipe.ingredients.forEach(ing => {
        if (ing.unit && !validUnitSymbols.includes(ing.unit)) {
          const matchingUnit = validUnits.find(u => u.name === ing.unit);
          if (!matchingUnit) {
            const ingredientName = ing.rawMaterial?.name || ing.finishedProduct?.name || 'Unknown';
            recipeIssues.push(`Recipe "${recipe.name}" ingredient "${ingredientName}": invalid unit "${ing.unit}"`);
          }
        }
      });
    });
    
    if (recipeIssues.length > 0) {
      console.log('Recipe unit issues:');
      recipeIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✓ All recipes have valid units');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventoryUnits();