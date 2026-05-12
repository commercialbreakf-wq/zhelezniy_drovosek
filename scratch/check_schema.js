const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("PRAGMA table_info(products)", (err, rows) => {
    if (err) {
        console.error('Error fetching table info:', err.message);
    } else {
        console.log('Products table info:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
