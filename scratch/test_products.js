const http = require('http');

http.get('http://localhost:3000/api/products?page=1&limit=12', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('PRODUCT COUNT:', parsed.products.length);
      console.log('TOTAL:', parsed.pagination.total);
    } catch(e) {
      console.log('PARSE ERROR:', e.message);
      console.log('BODY:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});
