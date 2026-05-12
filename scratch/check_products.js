const http = require('http');

http.get('http://localhost:3000/api/products?page=1&limit=20', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log('Products count:', json.products.length);
        console.log('First product:', json.products[0]?.name);
        console.log('Pagination:', json.pagination);
    });
}).on('error', (err) => {
    console.error('Error fetching products:', err.message);
});
