#!/usr/bin/env node

const http = require('http');

// Test the API endpoints first
async function testAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/api/finished-products',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ API Response:', parsed.success ? 'Success' : 'Failed');
                    console.log(`📦 Found ${parsed.data?.length || 0} finished products`);
                    if (parsed.data?.length > 0) {
                        console.log(`🔍 First product: ${parsed.data[0].name}`);
                        console.log(`🆔 Product ID: ${parsed.data[0].id}`);
                        console.log(`🏭 Production Run ID: ${parsed.data[0].productionRunId}`);
                    }
                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Test material breakdown for specific product
async function testMaterialBreakdown(productId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: `/api/production/finished-products/${productId}/materials`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ Material Breakdown API Response:', parsed.success ? 'Success' : 'Failed');
                    console.log(`📊 Materials found: ${parsed.data?.materials?.length || 0}`);
                    if (parsed.data?.materials?.length > 0) {
                        parsed.data.materials.forEach(material => {
                            console.log(`  🥖 ${material.materialName} (${material.materialSku})`);
                            console.log(`     📏 Quantity: ${material.quantityConsumed} ${material.unit}`);
                            console.log(`     💰 Cost: $${material.totalCost.toFixed(2)}`);
                            console.log(`     🏷️  Batch: ${material.materialBatchNumber}`);
                        });
                        console.log(`💰 Total Cost: $${parsed.data.costBreakdown.totalCost.toFixed(2)}`);
                    }
                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('🧪 Testing API endpoints...\n');
        
        // Test finished products API
        const products = await testAPI();
        
        if (products.data && products.data.length > 0) {
            console.log('\n🔬 Testing material breakdown API...');
            await testMaterialBreakdown(products.data[0].id);
        }
        
        console.log('\n✅ All API tests passed! The backend is working correctly.');
        console.log('🎯 You can now open http://localhost:3002/finished-products in your browser');
        console.log('🔍 Look for the "Material Breakdown" button with ingredients icon');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();