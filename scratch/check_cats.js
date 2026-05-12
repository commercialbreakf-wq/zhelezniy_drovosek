const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT DISTINCT parent_category, category FROM products', (err, rows) => {
    if (err) {
        console.error('Error fetching categories:', err.message);
    } else {
        console.log('Categories in DB:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
