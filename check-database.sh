#!/bin/bash

echo "🔍 Checking Database Status..."

cd backend

# Generate a diagnostic script
cat > db-diagnostic.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 Database Diagnostic Report');
    console.log('============================');
    
    // Check connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Count entities in key tables
    const categoryCount = await prisma.category.count();
    const supplierCount = await prisma.supplier.count();
    const storageLocationCount = await prisma.storageLocation.count();
    const rawMaterialCount = await prisma.rawMaterial.count();
    const intermediateProductCount = await prisma.intermediateProduct.count();
    const finishedProductCount = await prisma.finishedProduct.count();
    const recipeCount = await prisma.recipe.count();
    
    console.log('\n📈 Table Counts');
    console.log('----------------');
    console.log(`Categories: ${categoryCount}`);
    console.log(`Suppliers: ${supplierCount}`);
    console.log(`Storage Locations: ${storageLocationCount}`);
    console.log(`Raw Materials: ${rawMaterialCount}`);
    console.log(`Intermediate Products: ${intermediateProductCount}`);
    console.log(`Finished Products: ${finishedProductCount}`);
    console.log(`Recipes: ${recipeCount}`);
    
    if (categoryCount === 0 && supplierCount === 0 && storageLocationCount === 0) {
      console.log('\n❌ Database appears to be empty. No seed data found.');
      console.log('💡 Recommendation: Run the seeding process with:');
      console.log('   npx prisma db seed');
    } else {
      console.log('\n✅ Database contains data');
    }
    
    // Check if seed is properly configured
    try {
      const packageJsonPath = path.resolve(__dirname, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.prisma || !packageJson.prisma.seed) {
        console.log('\n⚠️ Warning: prisma.seed not configured in package.json');
        console.log('💡 Recommendation: Add the following to package.json:');
        console.log('   "prisma": {');
        console.log('     "seed": "tsx prisma/seed.ts"');
        console.log('   }');
      } else {
        console.log(`\n✅ Seed script configured: ${packageJson.prisma.seed}`);
      }
    } catch (err) {
      console.log('\n⚠️ Warning: Could not read package.json');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
EOF

# Run the diagnostic script
echo "Running database diagnostics..."
npx tsx db-diagnostic.ts

# Cleanup
rm db-diagnostic.ts
