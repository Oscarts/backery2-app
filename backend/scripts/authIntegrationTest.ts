import fetch from 'node-fetch';

async function main() {
    const url = process.argv[2] || 'http://localhost:8000/api/auth/login';
    const body = { email: 'admin@abcbakery.com', password: 'password123' };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);

        if (res.status !== 200) {
            console.error('Auth integration test failed');
            process.exit(2);
        }

        console.log('Auth integration test passed');
        process.exit(0);
    } catch (err) {
        console.error('Request failed:', err);
        process.exit(1);
    }
}

main();
