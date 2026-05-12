const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function migrate() {
  console.log('Starting migration...');

  // 1. Get products from SQLite
  const products = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM products", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(`Found ${products.length} products in SQLite.`);

  // 2. Prepare products for Supabase (handle field mapping)
  const supabaseProducts = products.map(p => ({
    name: p.name,
    category: p.category,
    parent_category: p.parent_category,
    vid: p.vid,
    length: p.length,
    width: p.width,
    type: p.type,
    price_ton: p.price_ton,
    price_unit: p.price_unit,
    unit_label: p.unit_label,
    weight: p.weight,
    image: p.image,
    description: p.description,
    specs: p.specs // SQLite stores as string, Supabase JSONB will handle it
  }));

  // 3. Insert into Supabase
  // Note: Tables must exist. I will provide the SQL to the user.
  // But I'll try to insert anyway.
  console.log('Inserting products into Supabase...');
  
  const { error } = await supabase
    .from('products')
    .insert(supabaseProducts);

  if (error) {
    if (error.code === '42P01') {
      console.error('ERROR: Table "products" does not exist in Supabase.');
      console.log('Please run the SQL script provided in the chat first!');
    } else {
      console.error('Migration error:', error.message);
    }
  } else {
    console.log('Products migrated successfully!');
  }

  db.close();
}

migrate();
