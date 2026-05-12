const http = require('http');

http.get('http://localhost:3000/api/filters', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Filters API response:', data);
    });
}).on('error', (err) => {
    console.error('Error fetching filters:', err.message);
});
