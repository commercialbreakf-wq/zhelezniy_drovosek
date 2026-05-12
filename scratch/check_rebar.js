const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT 
    parent_category, 
    category, 
    COUNT(*) as count 
  FROM products 
  WHERE category LIKE '%Арматура%' OR parent_category LIKE '%Арматура%'
  GROUP BY parent_category, category
`, (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Categories found:');
  console.table(rows);
  db.close();
});
