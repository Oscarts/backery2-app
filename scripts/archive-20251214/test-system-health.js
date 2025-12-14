#!/usr/bin/env node

/**
 * System Health Check
 * Tests all pages and API endpoints to ensure everything works after seeding
 */

const BASE_URL = 'http://localhost:8000/api';

const endpoints = [
  { name: 'Raw Materials', path: '/raw-materials', expectedMin: 3 },
  { name: 'Finished Products', path: '/finished-products', expectedMin: 2 },
  { name: 'Recipes', path: '/recipes', expectedMin: 3 },
  { name: 'Production Runs', path: '/production-runs', expectedMin: 0 },
  { name: 'Categories', path: '/categories', expectedMin: 3 },
  { name: 'Suppliers', path: '/suppliers', expectedMin: 1 },
  { name: 'Units', path: '/units', expectedMin: 4 },
  { name: 'Storage Locations', path: '/storage-locations', expectedMin: 2 },
  { name: 'Quality Statuses', path: '/quality-statuses', expectedMin: 2 },
  { name: 'Customers', path: '/customers', expectedMin: 1 }
];

async function checkEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`);
    
    if (!response.ok) {
      return {
        name: endpoint.name,
        status: '❌ FAILED',
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const count = data.data?.length || 0;
    const meetsMin = count >= endpoint.expectedMin;
    
    return {
      name: endpoint.name,
      status: meetsMin ? '✅ PASS' : '⚠️  WARN',
      count,
      expected: endpoint.expectedMin,
      message: meetsMin ? 'OK' : `Expected at least ${endpoint.expectedMin}, got ${count}`
    };
  } catch (error) {
    return {
      name: endpoint.name,
      status: '❌ ERROR',
      error: error.message
    };
  }
}

async function testDataIntegrity() {
  console.log('\n' + '='.repeat(70));
  console.log('SYSTEM HEALTH CHECK - Data Integrity');
  console.log('='.repeat(70) + '\n');

  const results = await Promise.all(endpoints.map(checkEndpoint));
  
  console.log('API Endpoint Health:');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  results.forEach(result => {
    const statusIcon = result.status;
    const countInfo = result.count !== undefined ? ` (${result.count} items)` : '';
    const message = result.error || result.message || '';
    
    console.log(`${statusIcon} ${result.name.padEnd(25)} ${countInfo.padEnd(15)} ${message}`);
    
    if (result.status.includes('❌') || result.status.includes('⚠️')) {
      allPassed = false;
    }
  });
  
  console.log('-'.repeat(70));
  console.log(allPassed ? '✅ All checks passed!' : '⚠️  Some checks failed - review above');
  console.log('='.repeat(70) + '\n');
}

async function testRecipeIngredients() {
  console.log('Testing Recipe Ingredients:');
  console.log('-'.repeat(70));
  
  try {
    const response = await fetch(`${BASE_URL}/recipes`);
    const data = await response.json();
    const recipes = data.data || [];
    
    if (recipes.length === 0) {
      console.log('⚠️  No recipes found');
      return;
    }
    
    for (const recipe of recipes) {
      const ingredientCount = recipe.ingredients?.length || 0;
      const status = ingredientCount > 0 ? '✅' : '⚠️';
      console.log(`${status} ${recipe.name.padEnd(35)} - ${ingredientCount} ingredients`);
    }
    
    console.log('-'.repeat(70) + '\n');
  } catch (error) {
    console.log(`❌ Error checking recipes: ${error.message}\n`);
  }
}

async function testDataRelationships() {
  console.log('Testing Data Relationships:');
  console.log('-'.repeat(70));
  
  try {
    // Check raw materials have required relationships
    const rmResponse = await fetch(`${BASE_URL}/raw-materials`);
    const rmData = await rmResponse.json();
    const materials = rmData.data || [];
    
    let missingRelations = 0;
    materials.forEach(material => {
      const hasSupplier = !!material.supplier;
      const hasCategory = !!material.category;
      const hasStorage = !!material.storageLocation;
      const hasUnit = !!material.unitDetails;
      
      if (!hasSupplier || !hasCategory || !hasStorage || !hasUnit) {
        missingRelations++;
        console.log(`⚠️  ${material.name}: Missing ${[
          !hasSupplier && 'supplier',
          !hasCategory && 'category', 
          !hasStorage && 'storage',
          !hasUnit && 'unit'
        ].filter(Boolean).join(', ')}`);
      }
    });
    
    if (missingRelations === 0) {
      console.log(`✅ All ${materials.length} raw materials have complete relationships`);
    }
    
    console.log('-'.repeat(70) + '\n');
  } catch (error) {
    console.log(`❌ Error checking relationships: ${error.message}\n`);
  }
}

async function main() {
  console.log('\n🏥 Starting System Health Check...\n');
  
  await testDataIntegrity();
  await testRecipeIngredients();
  await testDataRelationships();
  
  console.log('📋 Summary:');
  console.log('-'.repeat(70));
  console.log('✅ Raw Materials page should display data');
  console.log('✅ Finished Products page should display data');
  console.log('✅ Recipes page should display data with ingredients');
  console.log('✅ Production page may be empty (no production runs yet)');
  console.log('-'.repeat(70));
  console.log('\n💡 Next Steps:');
  console.log('   1. Open http://localhost:3002/raw-materials - verify table shows items');
  console.log('   2. Open http://localhost:3002/finished-products - verify table shows items');
  console.log('   3. Open http://localhost:3002/recipes - verify cards/list shows recipes');
  console.log('   4. Open http://localhost:3002/production - verify page loads (may be empty)');
  console.log('   5. Open http://localhost:3002/api-test - run tests to verify they still pass');
  console.log('');
}

main().catch(console.error);
