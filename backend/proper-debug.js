// Proper debug - Complete steps then update status
const axios = require('axios');

async function properDebug() {
    try {
        console.log('Creating production run...');
        const createResponse = await axios.post('http://localhost:8000/api/production/runs', {
            name: 'Proper Debug',
            recipeId: 'cmfblpwfb000toqndhe1jszon',
            targetQuantity: 1,
            targetUnit: 'kg'
        });
        
        const id = createResponse.data.data.id;
        console.log(`Created: ${id}`);
        
        // Complete all steps first
        console.log('\nCompleting all steps...');
        const stepsResponse = await axios.get(`http://localhost:8000/api/production/runs/${id}/steps`);
        const steps = stepsResponse.data.data;
        
        for (const step of steps) {
            await axios.put(`http://localhost:8000/api/production/steps/${step.id}`, {
                status: 'COMPLETED'
            });
            console.log(`✅ Completed step: ${step.name}`);
        }
        
        // Now update to COMPLETED - this should work now
        console.log('\n>>> TRIGGERING STATUS UPDATE TO COMPLETED <<<');
        const updateResponse = await axios.put(`http://localhost:8000/api/production/runs/${id}`, {
            status: 'COMPLETED'
        });
        
        console.log('Update response:', updateResponse.data.data.status);
        console.log('Production completed:', updateResponse.data.data.productionCompleted);
        
        // Check finished products
        const fpResponse = await axios.get('http://localhost:8000/api/finished-products');
        const matchingProducts = fpResponse.data.data.filter(fp => fp.name.includes('BATCH-'));
        console.log(`\nFinished products with batch numbers: ${matchingProducts.length}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

properDebug();