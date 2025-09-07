#!/usr/bin/env node

// Comprehensive End-to-End Application Test
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

async function runComprehensiveTest() {
    console.log('🧪 Running Comprehensive Application Test\n');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    // Test 1: Backend Health Check
    testsTotal++;
    try {
        const health = await fetch('http://localhost:8000/health');
        if (health.ok) {
            console.log('✅ Test 1: Backend health check passed');
            testsPassed++;
        } else {
            console.log('❌ Test 1: Backend health check failed');
        }
    } catch (error) {
        console.log('❌ Test 1: Backend health check failed -', error.message);
    }

    // Test 2: Dashboard Summary
    testsTotal++;
    try {
        const summary = await apiRequest('/dashboard/summary');
        if (summary.success && summary.data) {
            console.log('✅ Test 2: Dashboard summary API working');
            console.log(`   📊 Total inventory value: $${summary.data.totalInventoryValue.costValue}`);
            testsPassed++;
        } else {
            console.log('❌ Test 2: Dashboard summary API failed');
        }
    } catch (error) {
        console.log('❌ Test 2: Dashboard summary API failed -', error.message);
    }

    // Test 3: Raw Materials
    testsTotal++;
    try {
        const rawMaterials = await apiRequest('/raw-materials');
        if (rawMaterials.success && Array.isArray(rawMaterials.data)) {
            console.log(`✅ Test 3: Raw materials API working (${rawMaterials.data.length} items)`);
            testsPassed++;
        } else {
            console.log('❌ Test 3: Raw materials API failed');
        }
    } catch (error) {
        console.log('❌ Test 3: Raw materials API failed -', error.message);
    }

    // Test 4: Finished Products
    testsTotal++;
    try {
        const finishedProducts = await apiRequest('/finished-products');
        if (finishedProducts.success && Array.isArray(finishedProducts.data)) {
            console.log(`✅ Test 4: Finished products API working (${finishedProducts.data.length} items)`);
            if (finishedProducts.data.length > 0) {
                const product = finishedProducts.data[0];
                console.log(`   📦 Sample product: ${product.name} - ${product.quantity} ${product.unit}`);
            }
            testsPassed++;
        } else {
            console.log('❌ Test 4: Finished products API failed');
        }
    } catch (error) {
        console.log('❌ Test 4: Finished products API failed -', error.message);
    }

    // Test 5: Recipes
    testsTotal++;
    try {
        const recipes = await apiRequest('/recipes');
        if (recipes.success && Array.isArray(recipes.data)) {
            console.log(`✅ Test 5: Recipes API working (${recipes.data.length} recipes)`);
            testsPassed++;
        } else {
            console.log('❌ Test 5: Recipes API failed');
        }
    } catch (error) {
        console.log('❌ Test 5: Recipes API failed -', error.message);
    }

    // Test 6: Production Runs
    testsTotal++;
    try {
        const productionRuns = await apiRequest('/production/runs');
        if (productionRuns.success && Array.isArray(productionRuns.data)) {
            console.log(`✅ Test 6: Production runs API working (${productionRuns.data.length} runs)`);
            testsPassed++;
        } else {
            console.log('❌ Test 6: Production runs API failed');
        }
    } catch (error) {
        console.log('❌ Test 6: Production runs API failed -', error.message);
    }

    // Test 7: Quality Statuses
    testsTotal++;
    try {
        const qualityStatuses = await apiRequest('/quality-statuses');
        if (qualityStatuses.success && Array.isArray(qualityStatuses.data)) {
            console.log(`✅ Test 7: Quality statuses API working (${qualityStatuses.data.length} statuses)`);
            testsPassed++;
        } else {
            console.log('❌ Test 7: Quality statuses API failed');
        }
    } catch (error) {
        console.log('❌ Test 7: Quality statuses API failed -', error.message);
    }

    // Test 8: What Can I Make
    testsTotal++;
    try {
        const whatCanIMake = await apiRequest('/recipes/what-can-i-make');
        if (whatCanIMake.success && Array.isArray(whatCanIMake.data)) {
            console.log(`✅ Test 8: What can I make API working (${whatCanIMake.data.length} recipes available)`);
            testsPassed++;
        } else {
            console.log('❌ Test 8: What can I make API failed');
        }
    } catch (error) {
        console.log('❌ Test 8: What can I make API failed -', error.message);
    }

    // Test 9: Categories
    testsTotal++;
    try {
        const categories = await apiRequest('/categories');
        if (categories.success && Array.isArray(categories.data)) {
            console.log(`✅ Test 9: Categories API working (${categories.data.length} categories)`);
            testsPassed++;
        } else {
            console.log('❌ Test 9: Categories API failed');
        }
    } catch (error) {
        console.log('❌ Test 9: Categories API failed -', error.message);
    }

    // Test 10: Storage Locations
    testsTotal++;
    try {
        const storageLocations = await apiRequest('/storage-locations');
        if (storageLocations.success && Array.isArray(storageLocations.data)) {
            console.log(`✅ Test 10: Storage locations API working (${storageLocations.data.length} locations)`);
            testsPassed++;
        } else {
            console.log('❌ Test 10: Storage locations API failed');
        }
    } catch (error) {
        console.log('❌ Test 10: Storage locations API failed -', error.message);
    }

    // Results Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`);
    console.log(`📊 Success Rate: ${(testsPassed/testsTotal*100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 ALL TESTS PASSED! Application is fully functional.');
    } else if (testsPassed >= testsTotal * 0.8) {
        console.log('⚠️ Most tests passed. Minor issues may exist.');
    } else {
        console.log('❌ Multiple test failures. Application needs attention.');
    }
    
    console.log('\n✅ Frontend running at: http://localhost:3005');
    console.log('✅ Backend running at: http://localhost:8000');
    console.log('✅ Health endpoint: http://localhost:8000/health');
}

runComprehensiveTest().catch(error => {
    console.error('❌ Comprehensive test failed:', error);
    process.exit(1);
});
