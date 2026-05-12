const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT DISTINCT category FROM products', (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('CATEGORIES:', rows.map(r => r.category));
  
  db.all('SELECT DISTINCT parent_category FROM products', (err, rows) => {
    if (err) { console.error(err); process.exit(1); }
    console.log('PARENT CATEGORIES:', rows.map(r => r.parent_category));
    db.close();
  });
});
