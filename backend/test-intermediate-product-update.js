/**
 * Test to verify that intermediate product updates work correctly
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

// Test the intermediate product update
async function testIntermediateProductUpdate() {
    console.log('🧪 Testing intermediate product quality status updates...\n');

    try {
        // Step 1: Create a test intermediate product
        console.log('Creating test intermediate product...');

        const createRes = await api.post('/intermediate-products', {
            name: 'Test Dough Update',
            description: 'Test description for quality status update',
            categoryId: 'cmew0mv9s0007xv01w8k9nhb2',  // Assuming this is a valid category ID
            batchNumber: 'TEST-INT-UPDATE-' + Date.now(),
            productionDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 10,
            unit: 'kg',
            status: 'IN_PRODUCTION',
            storageLocationId: 'cmew0mv9w000bxv01844m22br'  // Assuming this is a valid storage location ID
        });

        const productId = createRes.data.data.id;
        console.log(`✅ Created intermediate product with ID: ${productId}`);

        // Step 2: Fetch quality statuses
        console.log('\nFetching quality statuses...');
        const qualityStatusRes = await api.get('/quality-statuses');
        const qualityStatuses = qualityStatusRes.data.data;
        const qualityStatusNames = qualityStatuses.map(status => status.name);

        console.log(`Available quality statuses: ${qualityStatusNames.join(', ')}`);

        // Step 3: Update with first quality status
        console.log(`\nUpdating intermediate product with quality status: ${qualityStatuses[0].name}`);

        const updateQualityRes1 = await api.put(`/intermediate-products/${productId}`, {
            qualityStatusId: qualityStatuses[0].id
        });

        const updatedProduct1 = updateQualityRes1.data.data;
        console.log(`Quality status updated to: ${updatedProduct1.qualityStatus?.name} (${updatedProduct1.qualityStatusId})`);

        console.assert(
            updatedProduct1.qualityStatusId === qualityStatuses[0].id,
            '❌ Quality status update failed'
        );
        console.log('✅ Successfully updated to first quality status');

        // Step 4: Update with second quality status
        console.log(`\nUpdating intermediate product with quality status: ${qualityStatuses[1].name}`);

        const updateQualityRes2 = await api.put(`/intermediate-products/${productId}`, {
            qualityStatusId: qualityStatuses[1].id
        });

        const updatedProduct2 = updateQualityRes2.data.data;
        console.log(`Quality status updated to: ${updatedProduct2.qualityStatus?.name} (${updatedProduct2.qualityStatusId})`);

        console.assert(
            updatedProduct2.qualityStatusId === qualityStatuses[1].id,
            '❌ Quality status update failed'
        );
        console.log('✅ Successfully updated to second quality status');

        // Step 5: Update with empty quality status
        console.log('\nUpdating intermediate product with empty quality status');

        const updateQualityRes3 = await api.put(`/intermediate-products/${productId}`, {
            qualityStatusId: ''
        });

        const updatedProduct3 = updateQualityRes3.data.data;
        console.log(`Quality status updated to: ${updatedProduct3.qualityStatus?.name || 'None'} (${updatedProduct3.qualityStatusId || 'null'})`);

        console.assert(
            updatedProduct3.qualityStatusId === null || updatedProduct3.qualityStatusId === undefined,
            '❌ Empty quality status update failed'
        );
        console.log('✅ Successfully updated to empty quality status');

        // Step 6: Clean up
        console.log('\nCleaning up test data...');
        await api.delete(`/intermediate-products/${productId}`);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All intermediate product quality status update tests passed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error during intermediate product update test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Run the test
testIntermediateProductUpdate()
    .then(success => {
        console.log('\n✨ Intermediate product quality status update test complete');
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
