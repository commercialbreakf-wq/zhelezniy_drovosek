const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');

console.log('--- DB Check ---');
const stats = fs.statSync('./database.sqlite');
console.log('DB size:', stats.size);

const db = new sqlite3.Database('./database.sqlite');
db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('Products in DB:', row.count);
    db.close();
    
    console.log('\n--- Server Check ---');
    http.get('http://localhost:3000/api/filters', (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            const data = JSON.parse(body);
            console.log('Server totalCount:', data.totalCount);
            console.log('Server parentCategories:', data.parentCategories);
        });
    }).on('error', (err) => console.error('Server Error:', err.message));
});
