/**
 * Simple test to verify API Test page functionality after intermediate product removal
 */

const API_BASE_URL = 'http://localhost:8000/api';

async function testApiEndpoints() {
    console.log('🧪 Testing API endpoints used by the API Test page...\n');

    const endpoints = [
        { name: 'Categories API', url: '/categories' },
        { name: 'Storage Locations API', url: '/storage-locations' },
        { name: 'Units API', url: '/units' },
        { name: 'Suppliers API', url: '/suppliers' },
        { name: 'Raw Materials API', url: '/raw-materials' },
        { name: 'Finished Products API', url: '/finished-products' },
        { name: 'Dashboard Summary', url: '/dashboard/summary' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ ${endpoint.name}: Success (${data.data?.length || 'N/A'} items)`);
            } else {
                console.log(`❌ ${endpoint.name}: Failed - ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }

    console.log('\n🎯 API Test page should work with all these endpoints!');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testApiEndpoints().catch(console.error);