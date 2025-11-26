import fetch from 'node-fetch';

async function main() {
    const url = 'http://localhost:8000/api/auth/login';
    const body = { email: 'admin@abcbakery.com', password: 'password123' };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        console.log('Status:', res.status);
        console.log('Headers:');
        res.headers.forEach((v, k) => console.log(k + ':', v));
        const text = await res.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Request failed:', err);
        process.exit(1);
    }
}

main();
