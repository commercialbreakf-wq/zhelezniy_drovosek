const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Product count:', row.count);
  }
  db.close();
});
