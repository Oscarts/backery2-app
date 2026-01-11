const axios = require('axios');

async function testAPI() {
    try {
        // First, get a token by logging in
        const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
            email: 'admin@demobakery.com',
            password: 'admin123'
        });

        const token = loginResponse.data.data.token;
        console.log('Got token:', !!token);

        // Now test the SKU references endpoint
        const skuResponse = await axios.get('http://localhost:8000/api/sku-references', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('SKU References response:', JSON.stringify(skuResponse.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAPI();