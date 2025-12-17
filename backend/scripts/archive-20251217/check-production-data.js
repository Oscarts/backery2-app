const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductionData() {
  try {
    // Check production runs
    const productions = await prisma.productionRun.findMany({
      include: {
        recipe: { select: { id: true, name: true } },
        finishedProduct: { select: { id: true, name: true } }
      }
    });
    console.log(`Production runs: ${productions.length}`);
    productions.forEach(p => {
      console.log(`- Production ${p.id}: Recipe '${p.recipe?.name}' -> Product '${p.finishedProduct?.name}'`);
    });

    // Check production steps
    const steps = await prisma.productionStep.findMany();
    console.log(`\nProduction steps: ${steps.length}`);

    // Check production items
    const items = await prisma.productionItem.findMany();
    console.log(`Production items: ${items.length}`);

    // Check batches
    const batches = await prisma.productionBatch.findMany();
    console.log(`Production batches: ${batches.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionData();