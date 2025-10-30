/**
 * Database Unit Migration Script
 * 
 * Migrates existing database records from unit names to unit symbols.
 * Safe to run multiple times (idempotent).
 */

const { PrismaClient } = require('@prisma/client');
const { normalizeUnit } = require('./shared/constants/units');

const prisma = new PrismaClient();

async function migrateUnits() {
  console.log('🔄 Starting unit migration...\n');
  
  let totalMigrated = 0;
  let totalSkipped = 0;
  let errors = 0;
  
  try {
    // 1. Migrate Recipes
    console.log('📝 Migrating recipes...');
    const recipes = await prisma.recipe.findMany();
    
    for (const recipe of recipes) {
      try {
        if (recipe.yieldUnit) {
          const normalized = normalizeUnit(recipe.yieldUnit);
          
          if (normalized && normalized !== recipe.yieldUnit) {
            await prisma.recipe.update({
              where: { id: recipe.id },
              data: { yieldUnit: normalized }
            });
            console.log(`   ✓ Recipe "${recipe.name}": "${recipe.yieldUnit}" → "${normalized}"`);
            totalMigrated++;
          } else if (!normalized) {
            console.log(`   ⚠️  Recipe "${recipe.name}": Invalid unit "${recipe.yieldUnit}" - manual fix needed`);
            errors++;
          } else {
            totalSkipped++;
          }
        }
      } catch (error) {
        console.error(`   ✗ Error migrating recipe "${recipe.name}":`, error.message);
        errors++;
      }
    }
    
    // 2. Migrate Finished Products
    console.log('\n🎂 Migrating finished products...');
    const finishedProducts = await prisma.finishedProduct.findMany();
    
    for (const product of finishedProducts) {
      try {
        if (product.unit) {
          const normalized = normalizeUnit(product.unit);
          
          if (normalized && normalized !== product.unit) {
            await prisma.finishedProduct.update({
              where: { id: product.id },
              data: { unit: normalized }
            });
            console.log(`   ✓ Product "${product.name}": "${product.unit}" → "${normalized}"`);
            totalMigrated++;
          } else if (!normalized) {
            console.log(`   ⚠️  Product "${product.name}": Invalid unit "${product.unit}" - manual fix needed`);
            errors++;
          } else {
            totalSkipped++;
          }
        }
      } catch (error) {
        console.error(`   ✗ Error migrating product "${product.name}":`, error.message);
        errors++;
      }
    }
    
    // 3. Migrate Production Runs
    console.log('\n🏭 Migrating production runs...');
    const productionRuns = await prisma.productionRun.findMany();
    
    for (const run of productionRuns) {
      try {
        let updated = false;
        const updateData = {};
        
        if (run.targetUnit) {
          const normalized = normalizeUnit(run.targetUnit);
          if (normalized && normalized !== run.targetUnit) {
            updateData.targetUnit = normalized;
            updated = true;
            console.log(`   ✓ Run "${run.batchNumber}": targetUnit "${run.targetUnit}" → "${normalized}"`);
          } else if (!normalized) {
            console.log(`   ⚠️  Run "${run.batchNumber}": Invalid targetUnit "${run.targetUnit}" - manual fix needed`);
            errors++;
          }
        }
        
        if (updated) {
          await prisma.productionRun.update({
            where: { id: run.id },
            data: updateData
          });
          totalMigrated++;
        } else {
          totalSkipped++;
        }
      } catch (error) {
        console.error(`   ✗ Error migrating run "${run.batchNumber}":`, error.message);
        errors++;
      }
    }
    
    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Records migrated: ${totalMigrated}`);
    console.log(`⏭️  Records skipped (already valid): ${totalSkipped}`);
    console.log(`❌ Errors encountered: ${errors}`);
    console.log('='.repeat(60));
    
    if (errors > 0) {
      console.log('\n⚠️  Some records have invalid units that need manual correction.');
      console.log('   Please review the warnings above and update these records manually.');
    } else if (totalMigrated === 0) {
      console.log('\n✨ All units are already using the correct symbols! No migration needed.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateUnits()
    .then(() => {
      console.log('\n✅ Migration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUnits };
