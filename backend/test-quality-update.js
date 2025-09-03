/**
 * Test to verify that quality status updates work correctly in raw materials
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

// Test the raw material quality status update
async function testQualityStatusUpdate() {
    console.log('🧪 Testing raw material quality status updates...\n');

    try {
        // Step 1: Create a test raw material
        console.log('Creating test raw material...');

        const createRes = await api.post('/raw-materials', {
            name: 'Test Flour for Quality Update',
            categoryId: 'cmf3qfokb0003t0jjmk2uizzx',  // Flour category
            supplierId: 'cmf3qfoki0008t0jj29eg4win',  // Premium Flour Co.
            batchNumber: 'TEST-RM-QUALITY-' + Date.now(),
            purchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 10,
            unit: 'kg',
            costPerUnit: 2.5,
            reorderLevel: 5,
            storageLocationId: 'cmf3qfokk000ct0jjo5pk93zr'  // Dry Storage A
        });

        const rawMaterialId = createRes.data.data.id;
        console.log(`✅ Created raw material with ID: ${rawMaterialId}`);

        // Step 2: Get available quality statuses
        console.log('\nFetching quality statuses...');
        const qualityStatusRes = await api.get('/quality-statuses');
        const qualityStatuses = qualityStatusRes.data.data;

        if (qualityStatuses.length < 2) {
            throw new Error('Need at least 2 quality statuses for testing');
        }

        const firstQualityStatusId = qualityStatuses[0].id;
        const secondQualityStatusId = qualityStatuses[1].id;

        console.log(`Available quality statuses: ${qualityStatuses.map(qs => qs.name).join(', ')}`);

        // Step 3: Update with first quality status
        console.log(`\nUpdating raw material with quality status: ${qualityStatuses[0].name}`);
        const updateFirstRes = await api.put(`/raw-materials/${rawMaterialId}`, {
            qualityStatusId: firstQualityStatusId
        });

        const updatedFirstMaterial = updateFirstRes.data.data;
        console.log(`Quality status updated to: ${updatedFirstMaterial.qualityStatus?.name || 'None'} (${updatedFirstMaterial.qualityStatusId})`);
        console.assert(
            updatedFirstMaterial.qualityStatusId === firstQualityStatusId,
            `❌ Quality status update failed. Expected: ${firstQualityStatusId}, Got: ${updatedFirstMaterial.qualityStatusId}`
        );
        console.log('✅ Successfully updated to first quality status');

        // Step 4: Update with second quality status
        console.log(`\nUpdating raw material with quality status: ${qualityStatuses[1].name}`);
        const updateSecondRes = await api.put(`/raw-materials/${rawMaterialId}`, {
            qualityStatusId: secondQualityStatusId
        });

        const updatedSecondMaterial = updateSecondRes.data.data;
        console.log(`Quality status updated to: ${updatedSecondMaterial.qualityStatus?.name || 'None'} (${updatedSecondMaterial.qualityStatusId})`);
        console.assert(
            updatedSecondMaterial.qualityStatusId === secondQualityStatusId,
            `❌ Quality status update failed. Expected: ${secondQualityStatusId}, Got: ${updatedSecondMaterial.qualityStatusId}`
        );
        console.log('✅ Successfully updated to second quality status');

        // Step 5: Update with empty quality status
        console.log(`\nUpdating raw material with empty quality status`);
        const updateEmptyRes = await api.put(`/raw-materials/${rawMaterialId}`, {
            qualityStatusId: ''
        });

        const updatedEmptyMaterial = updateEmptyRes.data.data;
        console.log(`Quality status updated to: ${updatedEmptyMaterial.qualityStatus?.name || 'None'} (${updatedEmptyMaterial.qualityStatusId || 'null'})`);
        console.assert(
            updatedEmptyMaterial.qualityStatusId === null || updatedEmptyMaterial.qualityStatusId === undefined,
            `❌ Quality status update to empty failed. Expected: null, Got: ${updatedEmptyMaterial.qualityStatusId}`
        );
        console.log('✅ Successfully updated to empty quality status');

        // Step 6: Clean up
        console.log('\nCleaning up test data...');
        await api.delete(`/raw-materials/${rawMaterialId}`);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All raw material quality status update tests passed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error during raw material quality status update test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Run the test
testQualityStatusUpdate()
    .then(success => {
        console.log('\n✨ Raw material quality status update test complete');
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
