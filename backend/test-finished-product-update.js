/**
 * Test to verify that finished product updates work correctly
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

// Test the finished product update
async function testFinishedProductUpdate() {
    console.log('🧪 Testing finished product updates...\n');

    try {
        // Step 1: Create a test finished product
        console.log('Creating test finished product...');

        const createRes = await api.post('/finished-products', {
            name: 'Test Croissant Update',
            sku: 'TEST-CROISSANT-' + Date.now(),
            categoryId: 'cmf3qfokg0007t0jjv60pa0u6',  // Pastries category
            batchNumber: 'TEST-FP-UPDATE-' + Date.now(),
            productionDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            shelfLife: 5,
            quantity: 10,
            unit: 'pcs',
            salePrice: 3.99,
            storageLocationId: 'cmf3qfokk000ct0jjo5pk93zr'  // Dry Storage A
        });

        const productId = createRes.data.data.id;
        console.log(`✅ Created finished product with ID: ${productId}`);

        // Step 2: Update basic properties
        console.log('\nUpdating basic properties...');
        const updateBasicRes = await api.put(`/finished-products/${productId}`, {
            name: 'Updated Croissant',
            salePrice: 4.99
        });

        const updatedBasicProduct = updateBasicRes.data.data;
        console.assert(
            updatedBasicProduct.name === 'Updated Croissant' &&
            updatedBasicProduct.salePrice === 4.99,
            '❌ Basic property update failed'
        );
        console.log('✅ Successfully updated basic properties');

        // Step 3: Update contamination status to true
        console.log('\nUpdating contamination status to TRUE...');
        const updateContaminationTrueRes = await api.put(`/finished-products/${productId}`, {
            isContaminated: true
        });

        const updatedContaminatedProduct = updateContaminationTrueRes.data.data;
        console.log(`Contamination status: ${updatedContaminatedProduct.isContaminated}`);
        console.assert(
            updatedContaminatedProduct.isContaminated === true,
            '❌ Contamination status update to TRUE failed'
        );
        console.log('✅ Successfully updated contamination status to TRUE');

        // Step 4: Update contamination status to false
        console.log('\nUpdating contamination status to FALSE...');
        const updateContaminationFalseRes = await api.put(`/finished-products/${productId}`, {
            isContaminated: false
        });

        const updatedCleanProduct = updateContaminationFalseRes.data.data;
        console.log(`Contamination status: ${updatedCleanProduct.isContaminated}`);
        console.assert(
            updatedCleanProduct.isContaminated === false,
            '❌ Contamination status update to FALSE failed'
        );
        console.log('✅ Successfully updated contamination status to FALSE');

        // Step 5: Update quality status
        console.log('\nUpdating quality status...');
        const qualityStatusRes = await api.get('/quality-statuses');
        const qualityStatuses = qualityStatusRes.data.data;
        const qualityStatusId = qualityStatuses[0].id;

        const updateQualityRes = await api.put(`/finished-products/${productId}`, {
            qualityStatusId
        });

        const updatedQualityProduct = updateQualityRes.data.data;
        console.log(`Quality status ID: ${updatedQualityProduct.qualityStatusId}`);
        console.assert(
            updatedQualityProduct.qualityStatusId === qualityStatusId,
            '❌ Quality status update failed'
        );
        console.log('✅ Successfully updated quality status');

        // Step 6: Update packagingInfo with content
        console.log('\nUpdating packaging info with content...');
        const updatePackagingRes = await api.put(`/finished-products/${productId}`, {
            packagingInfo: "Test packaging information"
        });

        const updatedPackagingProduct = updatePackagingRes.data.data;
        console.log(`Packaging info: ${updatedPackagingProduct.packagingInfo}`);
        console.assert(
            updatedPackagingProduct.packagingInfo === "Test packaging information",
            '❌ Packaging info update failed'
        );
        console.log('✅ Successfully updated packaging info with content');

        // Step 7: Update packagingInfo with empty string
        console.log('\nUpdating packaging info with empty string...');
        const updateEmptyPackagingRes = await api.put(`/finished-products/${productId}`, {
            packagingInfo: ""
        });

        const updatedEmptyPackagingProduct = updateEmptyPackagingRes.data.data;
        console.log(`Packaging info (empty): ${updatedEmptyPackagingProduct.packagingInfo || 'null/undefined'}`);
        console.assert(
            updatedEmptyPackagingProduct.packagingInfo === null || updatedEmptyPackagingProduct.packagingInfo === "",
            '❌ Empty packaging info update failed'
        );
        console.log('✅ Successfully updated packaging info with empty string');

        // Step 8: Clean up
        console.log('\nCleaning up test data...');
        await api.delete(`/finished-products/${productId}`);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All finished product update tests passed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error during finished product update test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Run the test
testFinishedProductUpdate()
    .then(success => {
        console.log('\n✨ Finished product update test complete');
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
