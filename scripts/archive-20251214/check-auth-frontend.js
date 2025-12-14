/**
 * Frontend Authentication Checker
 * Add this to your browser console to check if auth is working
 */

// Check if token exists
const token = localStorage.getItem('token');
console.log('🔑 Auth Token:', token ? 'EXISTS' : '❌ MISSING');

if (token) {
    // Decode JWT to see the payload (without verification)
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        console.log('📋 Token Payload:', payload);
        console.log('👤 User ID:', payload.userId);
        console.log('🏢 Client ID:', payload.clientId);
        console.log('📧 Email:', payload.email);
        console.log('⏰ Expires:', new Date(payload.exp * 1000).toLocaleString());

        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
            console.error('❌ TOKEN IS EXPIRED!');
            console.log('💡 You need to log in again');
        } else {
            console.log('✅ Token is valid');
        }
    } catch (error) {
        console.error('❌ Error decoding token:', error);
    }
}

// Test API call to customers
if (token) {
    console.log('\n🧪 Testing API call to /api/customers...');
    fetch('http://localhost:8000/api/customers', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log('✅ API Response:', data);
            if (data.success) {
                console.log(`📊 Found ${data.data.length} customers`);
            } else {
                console.error('❌ API Error:', data.error);
            }
        })
        .catch(err => {
            console.error('❌ Network Error:', err);
        });
}