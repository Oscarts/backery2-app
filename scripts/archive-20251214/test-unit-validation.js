/**
 * Test Unit Validation System
 * 
 * This script tests the new unit validation middleware and shared constants.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testUnitValidation() {
  console.log('🧪 Testing Unit Validation System\n');
  
  // Test 1: Valid unit symbol (should succeed)
  console.log('✅ Test 1: Creating recipe with valid unit symbol (pcs)');
  try {
    const response = await axios.post(`${API_BASE}/recipes`, {
      name: 'Test Recipe - Valid Unit',
      yieldQuantity: 10,
      yieldUnit: 'pcs', // Valid symbol
      ingredients: []
    });
    console.log('   ✓ Recipe created successfully with unit:', response.data.data.yieldUnit);
  } catch (error) {
    console.log('   ✗ Failed:', error.response?.data?.error || error.message);
  }
  
  console.log('');
  
  // Test 2: Legacy unit name (should be normalized to symbol)
  console.log('✅ Test 2: Creating recipe with legacy unit name (Piece)');
  try {
    const response = await axios.post(`${API_BASE}/recipes`, {
      name: 'Test Recipe - Legacy Unit',
      yieldQuantity: 10,
      yieldUnit: 'Piece', // Should be normalized to 'pcs'
      ingredients: []
    });
    console.log('   ✓ Recipe created with normalized unit:', response.data.data.yieldUnit);
    if (response.data.data.yieldUnit === 'pcs') {
      console.log('   ✓ Unit was correctly normalized from "Piece" to "pcs"');
    }
  } catch (error) {
    console.log('   ✗ Failed:', error.response?.data?.error || error.message);
  }
  
  console.log('');
  
  // Test 3: Invalid unit (should fail)
  console.log('❌ Test 3: Creating recipe with invalid unit (xyz)');
  try {
    const response = await axios.post(`${API_BASE}/recipes`, {
      name: 'Test Recipe - Invalid Unit',
      yieldQuantity: 10,
      yieldUnit: 'xyz', // Invalid unit
      ingredients: []
    });
    console.log('   ✗ Should have failed but succeeded!');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('   ✓ Correctly rejected with 400 status');
      console.log('   ✓ Error message:', error.response.data.error);
      if (error.response.data.validUnits) {
        console.log('   ✓ Valid units provided in error response');
      }
    } else {
      console.log('   ✗ Failed with wrong error:', error.message);
    }
  }
  
  console.log('');
  
  // Test 4: Weight unit
  console.log('✅ Test 4: Creating recipe with weight unit (kg)');
  try {
    const response = await axios.post(`${API_BASE}/recipes`, {
      name: 'Test Recipe - Weight Unit',
      yieldQuantity: 2.5,
      yieldUnit: 'kg', // Valid weight unit
      ingredients: []
    });
    console.log('   ✓ Recipe created successfully with unit:', response.data.data.yieldUnit);
  } catch (error) {
    console.log('   ✗ Failed:', error.response?.data?.error || error.message);
  }
  
  console.log('');
  
  // Test 5: Volume unit
  console.log('✅ Test 5: Creating recipe with volume unit (L)');
  try {
    const response = await axios.post(`${API_BASE}/recipes`, {
      name: 'Test Recipe - Volume Unit',
      yieldQuantity: 1.5,
      yieldUnit: 'L', // Valid volume unit
      ingredients: []
    });
    console.log('   ✓ Recipe created successfully with unit:', response.data.data.yieldUnit);
  } catch (error) {
    console.log('   ✗ Failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n🎉 Unit validation tests completed!');
}

// Run tests
testUnitValidation().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});
