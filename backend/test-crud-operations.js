const axios = require('axios');

async function testCRUDOperations() {
  const baseURL = 'http://localhost:8000/api';
  let testResults = {
    categories: { passed: 0, failed: 0, tests: [] },
    suppliers: { passed: 0, failed: 0, tests: [] },
    storageLocations: { passed: 0, failed: 0, tests: [] },
    units: { passed: 0, failed: 0, tests: [] },
    qualityStatuses: { passed: 0, failed: 0, tests: [] }
  };

  console.log('🧪 Testing CRUD Operations with Uniqueness Constraints\n');

  // Helper function to run a test
  const runTest = async (entityType, testName, testFn) => {
    try {
      await testFn();
      testResults[entityType].passed++;
      testResults[entityType].tests.push(`✅ ${testName}`);
      console.log(`✅ ${entityType} - ${testName}`);
    } catch (error) {
      testResults[entityType].failed++;
      testResults[entityType].tests.push(`❌ ${testName}: ${error.message}`);
      console.log(`❌ ${entityType} - ${testName}: ${error.message}`);
    }
  };

  // Test Categories
  console.log('🏷️  Testing Categories...');
  let testCategoryId = null;

  await runTest('categories', 'CREATE category', async () => {
    const response = await axios.post(`${baseURL}/categories`, {
      name: 'Test Category CRUD',
      type: 'RAW_MATERIAL',
      description: 'Test category for CRUD testing'
    });
    testCategoryId = response.data.data.id;
    if (!response.data.success) throw new Error('Create failed');
  });

  await runTest('categories', 'CREATE duplicate category (should fail)', async () => {
    try {
      await axios.post(`${baseURL}/categories`, {
        name: 'Test Category CRUD',
        type: 'RAW_MATERIAL',
        description: 'Duplicate test'
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('categories', 'READ category', async () => {
    const response = await axios.get(`${baseURL}/categories`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Read failed');
    }
  });

  await runTest('categories', 'UPDATE category', async () => {
    if (!testCategoryId) throw new Error('No category to update');
    const response = await axios.put(`${baseURL}/categories/${testCategoryId}`, {
      name: 'Updated Test Category CRUD',
      description: 'Updated description'
    });
    if (!response.data.success) throw new Error('Update failed');
  });

  await runTest('categories', 'DELETE category', async () => {
    if (!testCategoryId) throw new Error('No category to delete');
    const response = await axios.delete(`${baseURL}/categories/${testCategoryId}`);
    if (!response.data.success) throw new Error('Delete failed');
  });

  // Test Suppliers
  console.log('\n🏭 Testing Suppliers...');
  let testSupplierId = null;

  await runTest('suppliers', 'CREATE supplier', async () => {
    const response = await axios.post(`${baseURL}/suppliers`, {
      name: 'Test Supplier CRUD',
      contactInfo: { email: 'test@example.com' },
      address: 'Test Address'
    });
    testSupplierId = response.data.data.id;
    if (!response.data.success) throw new Error('Create failed');
  });

  await runTest('suppliers', 'CREATE duplicate supplier (should fail)', async () => {
    try {
      await axios.post(`${baseURL}/suppliers`, {
        name: 'Test Supplier CRUD',
        contactInfo: { email: 'duplicate@example.com' }
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('suppliers', 'READ supplier', async () => {
    const response = await axios.get(`${baseURL}/suppliers`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Read failed');
    }
  });

  await runTest('suppliers', 'UPDATE supplier', async () => {
    if (!testSupplierId) throw new Error('No supplier to update');
    const response = await axios.put(`${baseURL}/suppliers/${testSupplierId}`, {
      name: 'Updated Test Supplier CRUD',
      address: 'Updated Address'
    });
    if (!response.data.success) throw new Error('Update failed');
  });

  await runTest('suppliers', 'DELETE supplier', async () => {
    if (!testSupplierId) throw new Error('No supplier to delete');
    const response = await axios.delete(`${baseURL}/suppliers/${testSupplierId}`);
    if (!response.data.success) throw new Error('Delete failed');
  });

  // Test Storage Locations
  console.log('\n📦 Testing Storage Locations...');
  let testLocationId = null;

  await runTest('storageLocations', 'CREATE storage location', async () => {
    const response = await axios.post(`${baseURL}/storage-locations`, {
      name: 'Test Location CRUD',
      type: 'DRY',
      description: 'Test location for CRUD testing'
    });
    testLocationId = response.data.data.id;
    if (!response.data.success) throw new Error('Create failed');
  });

  await runTest('storageLocations', 'CREATE duplicate storage location (should fail)', async () => {
    try {
      await axios.post(`${baseURL}/storage-locations`, {
        name: 'Test Location CRUD',
        type: 'COLD'
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('storageLocations', 'READ storage location', async () => {
    const response = await axios.get(`${baseURL}/storage-locations`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Read failed');
    }
  });

  await runTest('storageLocations', 'UPDATE storage location', async () => {
    if (!testLocationId) throw new Error('No location to update');
    const response = await axios.put(`${baseURL}/storage-locations/${testLocationId}`, {
      name: 'Updated Test Location CRUD',
      type: 'FROZEN'
    });
    if (!response.data.success) throw new Error('Update failed');
  });

  await runTest('storageLocations', 'DELETE storage location', async () => {
    if (!testLocationId) throw new Error('No location to delete');
    const response = await axios.delete(`${baseURL}/storage-locations/${testLocationId}`);
    if (!response.data.success) throw new Error('Delete failed');
  });

  // Test Units
  console.log('\n📏 Testing Units...');
  let testUnitId = null;

  await runTest('units', 'CREATE unit', async () => {
    const response = await axios.post(`${baseURL}/units`, {
      name: 'Test Unit CRUD',
      symbol: 'tuc',
      category: 'WEIGHT',
      description: 'Test unit for CRUD testing'
    });
    testUnitId = response.data.data.id;
    if (!response.data.success) throw new Error('Create failed');
  });

  await runTest('units', 'CREATE duplicate unit name (should fail)', async () => {
    try {
      await axios.post(`${baseURL}/units`, {
        name: 'Test Unit CRUD',
        symbol: 'tuc2',
        category: 'VOLUME'
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('units', 'CREATE duplicate unit symbol (should fail)', async () => {
    try {
      await axios.post(`${baseURL}/units`, {
        name: 'Test Unit CRUD 2',
        symbol: 'tuc',
        category: 'COUNT'
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('units', 'READ unit', async () => {
    const response = await axios.get(`${baseURL}/units`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Read failed');
    }
  });

  if (testUnitId) {
    await runTest('units', 'DELETE unit', async () => {
      const response = await axios.delete(`${baseURL}/units/${testUnitId}`);
      if (!response.data.success) throw new Error('Delete failed');
    });
  }

  // Test Quality Statuses
  console.log('\n📊 Testing Quality Statuses...');
  
  let testQualityId;
  
  await runTest('qualityStatuses', 'CREATE quality status', async () => {
    const response = await axios.post(`${baseURL}/quality-statuses`, {
      name: 'Test Quality CRUD',
      description: 'Test quality status for CRUD testing',
      color: '#FF0000'
    });
    testQualityId = response.data.data.id;
    if (!response.data.success) throw new Error('Create failed');
  });

  await runTest('qualityStatuses', 'CREATE duplicate quality status (should fail)', async () => {
    try {
      const response = await axios.post(`${baseURL}/quality-statuses`, {
        name: 'Test Quality CRUD',
        description: 'Duplicate test quality status',
        color: '#00FF00'
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // This is expected
      }
      throw error;
    }
  });

  await runTest('qualityStatuses', 'READ quality status', async () => {
    const response = await axios.get(`${baseURL}/quality-statuses`);
    if (!response.data.success) throw new Error('Read failed');
  });

  if (testQualityId) {
    await runTest('qualityStatuses', 'UPDATE quality status', async () => {
      const response = await axios.put(`${baseURL}/quality-statuses/${testQualityId}`, {
        name: 'Test Quality CRUD Updated',
        description: 'Updated test quality status',
        color: '#0000FF'
      });
      if (!response.data.success) throw new Error('Update failed');
    });

    await runTest('qualityStatuses', 'DELETE quality status', async () => {
      const response = await axios.delete(`${baseURL}/quality-statuses/${testQualityId}`);
      if (!response.data.success) throw new Error('Delete failed');
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
    console.log('🎉 All tests passed! CRUD operations with uniqueness constraints work perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please check the results above.');
  }
}

testCRUDOperations().catch(console.error);