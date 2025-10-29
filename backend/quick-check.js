const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickUnitsCheck() {
  try {
    const units = await prisma.unit.count();
    console.log(`Units in database: ${units}`);
    
    const rawMaterials = await prisma.rawMaterial.count();
    console.log(`Raw materials: ${rawMaterials}`);
    
    const finishedProducts = await prisma.finishedProduct.count();
    console.log(`Finished products: ${finishedProducts}`);
    
    const recipes = await prisma.recipe.count();
    console.log(`Recipes: ${recipes}`);
    
    console.log('✓ Database access working');
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickUnitsCheck();