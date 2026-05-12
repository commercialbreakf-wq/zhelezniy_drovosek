const http = require('http');

const endpoints = [
    '/api/filters',
    '/api/products?page=1&limit=20'
];

async function check() {
    for (const endpoint of endpoints) {
        console.log(`Checking ${endpoint}...`);
        try {
            const data = await new Promise((resolve, reject) => {
                http.get(`http://localhost:3000${endpoint}`, (res) => {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', () => resolve(JSON.parse(body)));
                }).on('error', reject);
            });
            console.log(`Response: ${JSON.stringify(data).substring(0, 100)}...`);
            if (data.totalCount === 0 || (data.pagination && data.pagination.total === 0)) {
                console.error(`ERROR: Endpoint ${endpoint} returned 0 products!`);
            } else {
                console.log(`SUCCESS: Found ${data.totalCount || data.pagination.total} products.`);
            }
        } catch (e) {
            console.error(`FAILED to check ${endpoint}: ${e.message}`);
        }
    }
}

check();
