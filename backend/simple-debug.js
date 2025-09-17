// Simple debug - Just update status to see logs
const axios = require('axios');

async function simpleDebug() {
    try {
        console.log('Creating production run...');
        const createResponse = await axios.post('http://localhost:8000/api/production/runs', {
            name: 'Simple Debug',
            recipeId: 'cmfblpwfb000toqndhe1jszon',
            targetQuantity: 1,
            targetUnit: 'kg'
        });
        
        const id = createResponse.data.data.id;
        console.log(`Created: ${id}`);
        
        // Get current status
        const getResponse = await axios.get(`http://localhost:8000/api/production/runs/${id}`);
        console.log(`Current status: ${getResponse.data.data.status}`);
        
        // Update to COMPLETED - this should trigger debug logs
        console.log('\n>>> TRIGGERING STATUS UPDATE TO COMPLETED <<<');
        const updateResponse = await axios.put(`http://localhost:8000/api/production/runs/${id}`, {
            status: 'COMPLETED'
        });
        
        console.log('Update response:', updateResponse.data.data.status);
        console.log('Production completed:', updateResponse.data.data.productionCompleted);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

simpleDebug();