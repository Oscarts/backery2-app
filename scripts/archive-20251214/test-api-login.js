#!/usr/bin/env node

/**
 * Test login via API endpoint
 */

const http = require('http');

async function testLoginAPI() {
    console.log('🔐 Testing Login via API');
    console.log('='.repeat(60));

    const loginData = JSON.stringify({
        email: 'oscar@test.com',
        password: 'oscar@test.com'
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    console.log('Attempting login with:');
    console.log(`  Email: oscar@test.com`);
    console.log(`  Password: oscar@test.com`);
    console.log('');

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log('');

            try {
                const response = JSON.parse(data);

                if (res.statusCode === 200) {
                    console.log('✅ LOGIN SUCCESSFUL!');
                    console.log('');
                    console.log('Response:');
                    console.log(JSON.stringify(response, null, 2));
                    console.log('');
                    console.log('Token received:', response.token ? 'YES' : 'NO');
                    console.log('User data:', response.user ? 'YES' : 'NO');
                } else {
                    console.log('❌ LOGIN FAILED');
                    console.log('');
                    console.log('Error response:');
                    console.log(JSON.stringify(response, null, 2));
                }
            } catch (error) {
                console.log('❌ Failed to parse response');
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error.message);
        console.log('');
        console.log('Make sure the backend server is running on port 8000');
    });

    req.write(loginData);
    req.end();
}

testLoginAPI();
