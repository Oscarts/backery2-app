// Debug test - Simple production completion call
const axios = require('axios');

async function debugProductionCompletion() {
    const baseURL = 'http://localhost:8000/api';
    
    try {
        console.log('🔍 Debug: Testing production completion with server logs...\n');
        
        // First create a new production run
        console.log('1️⃣ Creating new production run...');
        const createResponse = await axios.post(`${baseURL}/production/runs`, {
            name: 'Debug Test Production',
            recipeId: 'cmfblpwfb000toqndhe1jszon', // Basic Bread Dough Recipe
            targetQuantity: 1,
            targetUnit: 'kg',
            customSteps: []
        });
        
        const productionRunId = createResponse.data.data.id;
        console.log(`✅ Created production run: ${productionRunId}`);
        
        // Complete all steps
        console.log('\n2️⃣ Completing all steps...');
        const stepsResponse = await axios.get(`${baseURL}/production/runs/${productionRunId}/steps`);
        const steps = stepsResponse.data.data;
        
        for (const step of steps) {
            await axios.put(`${baseURL}/production/steps/${step.id}`, {
                status: 'COMPLETED'
            });
            console.log(`✅ Completed step: ${step.name}`);
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now trigger completion - this should show debug logs in server console
        console.log('\n3️⃣ Triggering production completion (check server console for debug logs)...');
        const completionResponse = await axios.put(`${baseURL}/production/runs/${productionRunId}`, {
            status: 'COMPLETED'
        });
        
        console.log('\n✅ Completion response received:');
        console.log(JSON.stringify(completionResponse.data, null, 2));
        
        // Check if finished products were created
        console.log('\n4️⃣ Checking finished products...');
        const finishedProductsResponse = await axios.get(`${baseURL}/finished-products`);
        const matchingProducts = finishedProductsResponse.data.data.filter(fp => 
            fp.name.includes('Basic Bread Dough Recipe') || 
            fp.name.includes('BATCH-')
        );
        console.log(`📦 Found ${matchingProducts.length} matching finished products`);
        if (matchingProducts.length > 0) {
            console.log('Latest finished product:', matchingProducts[matchingProducts.length - 1]);
        }
        
        // Clean up (commented out to see if products persist)
        // console.log('\n🧹 Cleaning up...');
        // await axios.delete(`${baseURL}/production/runs/${productionRunId}`);
        
        console.log('\n✅ Debug test completed - Finished products should be visible!');
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

debugProductionCompletion();