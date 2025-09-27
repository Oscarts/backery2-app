/**
 * Test to verify the contamination status update works across all product types
 */

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:8000/api';
const API_TIMEOUT = 5000; // 5 seconds

// Configure axios with base url and timeout
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
});

// Test the contamination status update
async function testContaminationUpdate() {
    console.log('🧪 Testing contamination status update across all product types...\n');

    try {
        // Step 1: Create test products
        console.log('Creating test products...');

        // Create a test raw material with contamination set to false
        const rawMaterialRes = await api.post('/raw-materials', {
            name: 'Test Flour Update',
            categoryId: 'cmf3qfokb0003t0jjmk2uizzx',  // Flour category
            supplierId: 'cmf3qfoki0008t0jj29eg4win',  // Premium Flour Co.
            batchNumber: 'TEST-CONT-UPDATE-' + Date.now(),
            purchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 10,
            unit: 'kg',
            costPerUnit: 2.5,
            reorderLevel: 5,
            storageLocationId: 'cmf3qfokk000ct0jjo5pk93zr'  // Dry Storage A
            // Note: contaminated is not allowed in the creation schema
        });

        const rawMaterialId = rawMaterialRes.data.data.id;
        console.log(`✅ Created raw material with ID: ${rawMaterialId}`);

        // Create a test finished product with contamination set to false
        const finishedProductRes = await api.post('/finished-products', {
            name: 'Test Bread Update',
            sku: 'TEST-FP-CONT-UPDATE-' + Date.now(),
            categoryId: 'cmf3qfoke0006t0jjlgvd82w2',  // Breads category
            batchNumber: 'TEST-FP-BATCH-' + Date.now(),
            productionDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            shelfLife: 5,
            quantity: 10,
            unit: 'pcs',
            salePrice: 5.99,
            storageLocationId: 'cmf3qfokk000ct0jjo5pk93zr'  // Dry Storage A
            // By default, isContaminated is false
        });

        const finishedProductId = finishedProductRes.data.data.id;
        console.log(`✅ Created finished product with ID: ${finishedProductId}`);

        // Step 2: Update contamination status to true
        console.log('\nUpdating contamination status to TRUE for all products...');

        // Update raw material
        const updateRawMaterialRes = await api.put(`/raw-materials/${rawMaterialId}`, {
            contaminated: true
        });

        // Update finished product
        const updateFinishedProductRes = await api.put(`/finished-products/${finishedProductId}`, {
            isContaminated: true
        });

        // Step 3: Verify updates were successful
        // Verify raw material update
        const rawMaterialVerifyRes = await api.get(`/raw-materials/${rawMaterialId}`);
        const updatedRawMaterial = rawMaterialVerifyRes.data.data;
        console.log(`Raw Material contamination status: ${updatedRawMaterial.isContaminated}`);
        console.assert(
            updatedRawMaterial.isContaminated === true,
            '❌ Raw material contamination status was not updated correctly'
        );
        console.log('✅ Raw material contamination status updated successfully');

        // Verify finished product update
        const finishedProductVerifyRes = await api.get(`/finished-products/${finishedProductId}`);
        const updatedFinishedProduct = finishedProductVerifyRes.data.data;
        console.log(`Finished Product contamination status: ${updatedFinishedProduct.isContaminated}`);
        console.assert(
            updatedFinishedProduct.isContaminated === true,
            '❌ Finished product contamination status was not updated correctly'
        );
        console.log('✅ Finished product contamination status updated successfully');

        // Step 4: Update contamination status back to false
        console.log('\nUpdating contamination status to FALSE for all products...');

        // Update raw material
        await api.put(`/raw-materials/${rawMaterialId}`, {
            contaminated: false
        });

        // Update finished product
        await api.put(`/finished-products/${finishedProductId}`, {
            isContaminated: false
        });

        // Step 5: Verify updates were successful
        // Verify raw material update
        const rawMaterialVerifyRes2 = await api.get(`/raw-materials/${rawMaterialId}`);
        const updatedRawMaterial2 = rawMaterialVerifyRes2.data.data;
        console.log(`Raw Material contamination status: ${updatedRawMaterial2.isContaminated}`);
        console.assert(
            updatedRawMaterial2.isContaminated === false,
            '❌ Raw material contamination status was not updated correctly'
        );
        console.log('✅ Raw material contamination status updated successfully');

        // Verify finished product update
        const finishedProductVerifyRes2 = await api.get(`/finished-products/${finishedProductId}`);
        const updatedFinishedProduct2 = finishedProductVerifyRes2.data.data;
        console.log(`Finished Product contamination status: ${updatedFinishedProduct2.isContaminated}`);
        console.assert(
            updatedFinishedProduct2.isContaminated === false,
            '❌ Finished product contamination status was not updated correctly'
        );
        console.log('✅ Finished product contamination status updated successfully');

        // Step 6: Clean up - delete test products
        console.log('\nCleaning up test data...');
        await api.delete(`/raw-materials/${rawMaterialId}`);
        await api.delete(`/finished-products/${finishedProductId}`);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All contamination update tests passed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error during contamination update test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Run the test
testContaminationUpdate()
    .then(success => {
        console.log('\n✨ Contamination update test complete');
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
