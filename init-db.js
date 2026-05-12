const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const fs = require('fs');

// Mock data from the products-data.js (hardcoded here for the script)
const PRODUCTS = [
  {
    id: "armatura-12-a3",
    category: "Арматура",
    name: "Арматура 12мм А3",
    priceTonNum: 45980,
    priceUnit: "42.26",
    unitLabel: "ЗА МЕТР",
    weight: "0.888 кг/м",
    desc: "Горячекатаная арматура периодического профиля класса А3 (А400). Применяется для армирования железобетонных конструкций, фундаментов, монолитных стен и перекрытий.",
    specs: JSON.stringify([
      ["Диаметр", "12 мм"],
      ["Класс", "А3 (А400)"],
      ["Длина", "11 700 мм"],
      ["Марка стали", "25Г2С / 35ГС"],
      ["Вес п/м", "0.888 кг"],
      ["Хлыстов в тонне", "93"]
    ]),
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGi-E0xJ3-mAFM9U00zuzvCt9eMNBIMYNQ-ImNgLd9C9Gjlvb-fBobIsYiRd3QcyKSD6vjP9U9haoB7a3mtyiFjkP9k_CWH6kN8mn4AkaZhfBYo1Zv559c7PkoSHcDcfo0zTlGnX8nA2_pZJ5Zy1xtBrXnBdk_3Z4XKUTCA1eZ_fCE_9gpOVNSxZhnqy4leKMoTXDWyExliYLoNy7Voxa3vN9B6bVAA9PV9ko8_uOAnjWKg7T40jl0z5qbtUT7ThnFHfe9Z8hXf6Q"
  },
  {
    id: "truba-prof-40x40x2",
    category: "Труба профильная",
    name: "Труба проф. 40х40х2",
    priceTonNum: 65032.26,
    priceUnit: "151.53",
    unitLabel: "ЗА МЕТР",
    weight: "2.33 кг/м",
    desc: "Профильная стальная труба квадратного сечения. Широко применяется в строительстве каркасных конструкций, ограждений, ворот, навесов и мебели.",
    specs: JSON.stringify([
      ["Сечение", "40×40 мм"],
      ["Толщина стенки", "2.0 мм"],
      ["Длина", "6 000 мм"],
      ["Марка стали", "Ст3пс/сп"],
      ["Вес п/м", "2.33 кг"],
      ["Метров в тонне", "429"]
    ]),
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYBafqavhZXKOKbARHn5fb0gu84i15TIlurDf1hgG_bTFIbDWkWaVgPBvHoLILlQxAxiJeebS_Etowjo01jWqSETz1iCovFHtwafY06CeUZOJy8YMpa1hpOrfKH9DRUmOBgXlDfcozifkUF_OK0W6lxS096Lw-rZJLPazTUPN9BlTRC3TvqnbgmCd3fpPWIsdxsAeQscZZX7roYGk6YAGq1NL8xS152ue-GPCDrp42Gb4D_-87BGx3TlDj0b9S_qsigfUAfqr35T0"
  },
  {
    id: "balka-20b1",
    category: "Балка",
    name: "Балка 20Б1",
    priceTonNum: 67820.5,
    priceUnit: "1444.59",
    unitLabel: "ЗА МЕТР",
    weight: "21.3 кг/м",
    desc: "Двутавровая балка с параллельными гранями полок. Применяется в строительстве для несущих конструкций, перекрытий и каркасов зданий.",
    specs: JSON.stringify([
      ["Тип", "20Б1"],
      ["Высота", "200 мм"],
      ["Длина", "12 000 мм"],
      ["Марка стали", "С255"],
      ["Вес п/м", "21.3 кг"],
      ["Метров в тонне", "47"]
    ]),
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOZKjHcdySy_b-vHyQREAqv5EgSKDYLUPq2SCqDPs4mZFbi_pb18ctb6asIFs9VPQz8lVLOiZLo6vYTDUAwnN5LXSEl33uOvwUBUvU9siwLr627HbUdh-_uZB7hZ7n4097fh4MZkdHG6ezKH66hi4iUPKNQQpn3dBy2LbNj5Gq79da9t33vUK1HxFJdwKQcUh2aY-ltLrk_hJI-lJg94D1zBj5yJZIlLDfiQBH6AFmk1bcwjBNLFWYqwKDpqm3El3_Qzrtb7vYCu8"
  }
];

db.serialize(() => {
  // Drop tables to ensure fresh schema during development
  db.run(`DROP TABLE IF EXISTS order_items`);
  db.run(`DROP TABLE IF EXISTS orders`);
  db.run(`DROP TABLE IF EXISTS products`);
  db.run(`DROP TABLE IF EXISTS categories`);
  db.run(`DROP TABLE IF EXISTS users`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    parent_category TEXT,
    vid TEXT,
    length TEXT,
    width TEXT,
    type TEXT,
    group_key TEXT,
    price_ton REAL,
    price_unit REAL,
    unit_label TEXT,
    weight TEXT,
    description TEXT,
    image TEXT,
    specs TEXT
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    company_name TEXT,
    inn TEXT,
    kpp TEXT,
    legal_address TEXT,
    actual_address TEXT,
    position TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    total REAL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_inn TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Order Items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id TEXT,
    product_name TEXT,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // Seed Products
  const stmt = db.prepare(`INSERT OR REPLACE INTO products (id, name, category, price_ton, price_unit, unit_label, weight, description, image, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  PRODUCTS.forEach(p => {
    stmt.run(p.id, p.name, p.category, p.priceTonNum, p.priceUnit, p.unitLabel, p.weight, p.desc, p.img, p.specs);
  });
  stmt.finalize();

  // Seed Categories
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const catStmt = db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`);
  categories.forEach(c => catStmt.run(c));
  catStmt.finalize();

  console.log("Database initialized and seeded.");
});

db.close();



