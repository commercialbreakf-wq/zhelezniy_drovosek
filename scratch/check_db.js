const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
        console.error('Error counting products:', err.message);
    } else {
        console.log('Total products in database:', row.count);
    }
    
    db.all('SELECT * FROM products LIMIT 5', (err, rows) => {
        if (err) {
            console.error('Error fetching sample products:', err.message);
        } else {
            console.log('Sample products:', JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
