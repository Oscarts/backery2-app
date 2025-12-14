/**
 * Comprehensive API functionality test including CRUD operations with uniqueness constraints
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Test results tracking
const testResults = {
  categories: { passed: 0, failed: 0, tests: [] },
  suppliers: { passed: 0, failed: 0, tests: [] },
  storageLocations: { passed: 0, failed: 0, tests: [] },
  units: { passed: 0, failed: 0, tests: [] },
  qualityStatuses: { passed: 0, failed: 0, tests: [] }
};

// Test runner function
async function runTest(entityType, testName, testFn) {
  try {
    await testFn();
    console.log(`✅ ${entityType} - ${testName}`);
    testResults[entityType].passed++;
    testResults[entityType].tests.push(`✅ ${testName}`);
  } catch (error) {
    console.log(`❌ ${entityType} - ${testName}: ${error.message}`);
    testResults[entityType].failed++;
    testResults[entityType].tests.push(`❌ ${testName}: ${error.message}`);
  }
}

async function testApiEndpoints() {
    console.log('🧪 Testing API endpoints used by the API Test page...\n');

    const endpoints = [
        { name: 'Categories API', url: '/categories' },
        { name: 'Storage Locations API', url: '/storage-locations' },
        { name: 'Units API', url: '/units' },
        { name: 'Suppliers API', url: '/suppliers' },
        { name: 'Raw Materials API', url: '/raw-materials' },
        { name: 'Finished Products API', url: '/finished-products' },
        { name: 'Dashboard Summary', url: '/dashboard/summary' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ ${endpoint.name}: Success (${data.data?.length || 'N/A'} items)`);
            } else {
                console.log(`❌ ${endpoint.name}: Failed - ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }

    console.log('\n🎯 API Test page should work with all these endpoints!');
}

// Comprehensive CRUD tests for settings entities
async function testCRUDOperations() {
    console.log('\n🧪 Testing CRUD Operations with Uniqueness Constraints\n');
    
    // Test Categories
    console.log('🏷️  Testing Categories...');
    
    let testCategoryId;
    
    await runTest('categories', 'CREATE category', async () => {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Category CRUD',
                type: 'RAW_MATERIAL',
                description: 'Test category for CRUD testing'
            })
        });
        const data = await response.json();
        testCategoryId = data.data.id;
        if (!data.success) throw new Error('Create failed');
    });

    await runTest('categories', 'CREATE duplicate category (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Category CRUD',
                    type: 'RAW_MATERIAL',
                    description: 'Duplicate test category'
                })
            });
            const data = await response.json();
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
            // Expected error, test passes
        }
    });

    await runTest('categories', 'READ category', async () => {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Read failed');
    });

    if (testCategoryId) {
        await runTest('categories', 'UPDATE category', async () => {
            const response = await fetch(`${API_BASE_URL}/categories/${testCategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Category CRUD Updated',
                    type: 'FINISHED_PRODUCT',
                    description: 'Updated test category'
                })
            });
            const data = await response.json();
            if (!data.success) throw new Error('Update failed');
        });

        await runTest('categories', 'DELETE category', async () => {
            const response = await fetch(`${API_BASE_URL}/categories/${testCategoryId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error('Delete failed');
        });
    }

    // Test Suppliers
    console.log('\n🏭 Testing Suppliers...');
    
    let testSupplierId;
    
    await runTest('suppliers', 'CREATE supplier', async () => {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Supplier CRUD',
                contactInfo: 'test@supplier.com',
                address: 'Test Address'
            })
        });
        const data = await response.json();
        testSupplierId = data.data.id;
        if (!data.success) throw new Error('Create failed');
    });

    await runTest('suppliers', 'CREATE duplicate supplier (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/suppliers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Supplier CRUD',
                    contactInfo: 'duplicate@supplier.com'
                })
            });
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
        }
    });

    await runTest('suppliers', 'READ supplier', async () => {
        const response = await fetch(`${API_BASE_URL}/suppliers`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Read failed');
    });

    if (testSupplierId) {
        await runTest('suppliers', 'UPDATE supplier', async () => {
            const response = await fetch(`${API_BASE_URL}/suppliers/${testSupplierId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Supplier CRUD Updated',
                    contactInfo: 'updated@supplier.com'
                })
            });
            const data = await response.json();
            if (!data.success) throw new Error('Update failed');
        });

        await runTest('suppliers', 'DELETE supplier', async () => {
            const response = await fetch(`${API_BASE_URL}/suppliers/${testSupplierId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error('Delete failed');
        });
    }

    // Test Storage Locations
    console.log('\n📦 Testing Storage Locations...');
    
    let testLocationId;
    
    await runTest('storageLocations', 'CREATE storage location', async () => {
        const response = await fetch(`${API_BASE_URL}/storage-locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Storage CRUD',
                description: 'Test storage location for CRUD testing'
            })
        });
        const data = await response.json();
        testLocationId = data.data.id;
        if (!data.success) throw new Error('Create failed');
    });

    await runTest('storageLocations', 'CREATE duplicate storage location (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/storage-locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Storage CRUD',
                    description: 'Duplicate test storage location'
                })
            });
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
        }
    });

    await runTest('storageLocations', 'READ storage location', async () => {
        const response = await fetch(`${API_BASE_URL}/storage-locations`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Read failed');
    });

    if (testLocationId) {
        await runTest('storageLocations', 'UPDATE storage location', async () => {
            const response = await fetch(`${API_BASE_URL}/storage-locations/${testLocationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Storage CRUD Updated',
                    description: 'Updated test storage location'
                })
            });
            const data = await response.json();
            if (!data.success) throw new Error('Update failed');
        });

        await runTest('storageLocations', 'DELETE storage location', async () => {
            const response = await fetch(`${API_BASE_URL}/storage-locations/${testLocationId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error('Delete failed');
        });
    }

    // Test Units
    console.log('\n📏 Testing Units...');
    
    let testUnitId;
    
    await runTest('units', 'CREATE unit', async () => {
        const response = await fetch(`${API_BASE_URL}/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Unit CRUD',
                symbol: 'tuc',
                category: 'WEIGHT',
                description: 'Test unit for CRUD testing'
            })
        });
        const data = await response.json();
        testUnitId = data.data.id;
        if (!data.success) throw new Error('Create failed');
    });

    await runTest('units', 'CREATE duplicate unit name (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Unit CRUD',
                    symbol: 'tuc2',
                    category: 'WEIGHT'
                })
            });
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
        }
    });

    await runTest('units', 'CREATE duplicate unit symbol (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Unit CRUD 2',
                    symbol: 'tuc',
                    category: 'WEIGHT'
                })
            });
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
        }
    });

    await runTest('units', 'READ unit', async () => {
        const response = await fetch(`${API_BASE_URL}/units`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Read failed');
    });

    if (testUnitId) {
        await runTest('units', 'DELETE unit', async () => {
            const response = await fetch(`${API_BASE_URL}/units/${testUnitId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error('Delete failed');
        });
    }

    // Test Quality Statuses
    console.log('\n📊 Testing Quality Statuses...');
    
    let testQualityId;
    
    await runTest('qualityStatuses', 'CREATE quality status', async () => {
        const response = await fetch(`${API_BASE_URL}/quality-statuses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Quality CRUD',
                description: 'Test quality status for CRUD testing',
                color: '#FF0000'
            })
        });
        const data = await response.json();
        testQualityId = data.data.id;
        if (!data.success) throw new Error('Create failed');
    });

    await runTest('qualityStatuses', 'CREATE duplicate quality status (should fail)', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quality-statuses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Quality CRUD',
                    description: 'Duplicate test quality status',
                    color: '#00FF00'
                })
            });
            if (response.status !== 400) throw new Error('Should have failed but succeeded');
        } catch (error) {
            if (error.message === 'Should have failed but succeeded') throw error;
        }
    });

    await runTest('qualityStatuses', 'READ quality status', async () => {
        const response = await fetch(`${API_BASE_URL}/quality-statuses`);
        const data = await response.json();
        if (!data.success) throw new Error('Read failed');
    });

    if (testQualityId) {
        await runTest('qualityStatuses', 'UPDATE quality status', async () => {
            const response = await fetch(`${API_BASE_URL}/quality-statuses/${testQualityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Quality CRUD Updated',
                    description: 'Updated test quality status',
                    color: '#0000FF'
                })
            });
            const data = await response.json();
            if (!data.success) throw new Error('Update failed');
        });

        await runTest('qualityStatuses', 'DELETE quality status', async () => {
            const response = await fetch(`${API_BASE_URL}/quality-statuses/${testQualityId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error('Delete failed');
        });
    }

    // Print Summary
    console.log('\n📊 Test Results Summary:');
    console.log('================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(testResults).forEach(([entityType, results]) => {
        console.log(`\n${entityType.toUpperCase()}:`);
        console.log(`  ✅ Passed: ${results.passed}`);
        console.log(`  ❌ Failed: ${results.failed}`);
        
        if (results.failed > 0) {
            console.log('  Failed tests:');
            results.tests.filter(test => test.startsWith('❌')).forEach(test => {
                console.log(`    ${test}`);
            });
        }
        
        totalPassed += results.passed;
        totalFailed += results.failed;
    });
    
    console.log('\n================================');
    console.log(`OVERALL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
        console.log('🎉 All CRUD tests passed! Settings system with uniqueness constraints works perfectly!');
    } else {
        console.log('⚠️  Some CRUD tests failed. Please check the results above.');
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Comprehensive API Tests\n');
    console.log('===================================\n');
    
    // Test basic API endpoints first
    await testApiEndpoints();
    
    // Test comprehensive CRUD operations
    await testCRUDOperations();
    
    console.log('\n🏁 All tests completed!');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

runAllTests().catch(console.error);