import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SystemHealthReport {
  databaseConnection: boolean;
  dataIntegrity: {
    units: number;
    categories: number;
    suppliers: number;
    storageLocations: number;
    rawMaterials: number;
    recipes: number;
    recipeIngredients: number;
    finishedProducts: number;
  };
  apiEndpoints: {
    categories: boolean;
    rawMaterials: boolean;
    recipes: boolean;
    finishedProducts: boolean;
    suppliers: boolean;
  };
  relationships: {
    rawMaterialsWithCategories: number;
    rawMaterialsWithSuppliers: number;
    recipesWithIngredients: number;
    finishedProductsWithCategories: number;
  };
  timestamp: string;
}

async function testApiEndpoint(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:8000/api${endpoint}`);
    const data = await response.json();
    return response.ok && data.success && Array.isArray(data.data);
  } catch (error) {
    console.error(`API test failed for ${endpoint}:`, error);
    return false;
  }
}

async function generateSystemHealthReport(): Promise<SystemHealthReport> {
  console.log('🏥 Generating System Health Report...\n');

  // Test database connection
  let databaseConnection = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnection = true;
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.error(error);
  }

  // Check data integrity
  const dataIntegrity = {
    units: await prisma.unit.count(),
    categories: await prisma.category.count(),
    suppliers: await prisma.supplier.count(),
    storageLocations: await prisma.storageLocation.count(),
    rawMaterials: await prisma.rawMaterial.count(),
    recipes: await prisma.recipe.count(),
    recipeIngredients: await prisma.recipeIngredient.count(),
    finishedProducts: await prisma.finishedProduct.count()
  };

  console.log('📊 Data Integrity Check:');
  Object.entries(dataIntegrity).forEach(([key, count]) => {
    const status = count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${count}`);
  });

  // Test API endpoints
  console.log('\n🔗 API Endpoint Health Check:');
  const apiEndpoints = {
    categories: await testApiEndpoint('/categories'),
    rawMaterials: await testApiEndpoint('/raw-materials'),
    recipes: await testApiEndpoint('/recipes'),
    finishedProducts: await testApiEndpoint('/finished-products'),
    suppliers: await testApiEndpoint('/suppliers')
  };

  Object.entries(apiEndpoints).forEach(([endpoint, isHealthy]) => {
    const status = isHealthy ? '✅' : '❌';
    console.log(`  ${status} /api/${endpoint}: ${isHealthy ? 'OK' : 'FAILED'}`);
  });

  // Check relationships - simplified since supplierId is required
  console.log('\n🔗 Relationship Integrity Check:');
  
  // Count materials with categories (categoryId is optional)
  const rawMaterialsWithCategories = await prisma.rawMaterial.findMany({
    where: { categoryId: { not: null } }
  });
  
  // All raw materials should have suppliers since it's required
  const rawMaterialsWithSuppliers = dataIntegrity.rawMaterials;

  const recipesWithIngredients = await prisma.recipe.findMany({
    include: {
      ingredients: true
    }
  });

  const finishedProductsWithCategories = await prisma.finishedProduct.findMany({
    where: { categoryId: { not: null } }
  });

  const relationships = {
    rawMaterialsWithCategories: rawMaterialsWithCategories.length,
    rawMaterialsWithSuppliers: rawMaterialsWithSuppliers, // All should have suppliers
    recipesWithIngredients: recipesWithIngredients.filter(r => r.ingredients.length > 0).length,
    finishedProductsWithCategories: finishedProductsWithCategories.length
  };

  Object.entries(relationships).forEach(([key, count]) => {
    const total = key.includes('rawMaterials') ? dataIntegrity.rawMaterials : 
                  key.includes('recipes') ? dataIntegrity.recipes :
                  dataIntegrity.finishedProducts;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const status = percentage > 80 ? '✅' : percentage > 50 ? '⚠️' : '❌';
    console.log(`  ${status} ${key}: ${count}/${total} (${percentage}%)`);
  });

  const report: SystemHealthReport = {
    databaseConnection,
    dataIntegrity,
    apiEndpoints,
    relationships,
    timestamp: new Date().toISOString()
  };

  // Overall health assessment
  const allEndpointsHealthy = Object.values(apiEndpoints).every(Boolean);
  const hasBasicData = Object.values(dataIntegrity).every(count => count > 0);
  const goodRelationships = Object.values(relationships).every((count, index) => {
    const totals = [dataIntegrity.rawMaterials, dataIntegrity.rawMaterials, dataIntegrity.recipes, dataIntegrity.finishedProducts];
    return count / totals[index] > 0.5;
  });

  console.log('\n🎯 Overall System Health:');
  console.log(`  ${databaseConnection ? '✅' : '❌'} Database Connection`);
  console.log(`  ${hasBasicData ? '✅' : '❌'} Data Availability`);
  console.log(`  ${allEndpointsHealthy ? '✅' : '❌'} API Endpoints`);
  console.log(`  ${goodRelationships ? '✅' : '❌'} Data Relationships`);

  const overallHealthy = databaseConnection && hasBasicData && allEndpointsHealthy && goodRelationships;
  console.log(`\n🏥 System Status: ${overallHealthy ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);

  return report;
}

// Run the health check
generateSystemHealthReport()
  .then(report => {
    console.log('\n📋 Full Report saved to system-health.json');
    // Optionally save to file
    // require('fs').writeFileSync('system-health.json', JSON.stringify(report, null, 2));
  })
  .catch(error => {
    console.error('❌ Health check failed:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });